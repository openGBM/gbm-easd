import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { logger } from '@/lib/logger'
import { checkAnalysisRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

// Schema de validación para el request body
const AnalysisRequestSchema = z.object({
  sessionId: z.string().uuid('sessionId debe ser un UUID válido'),
  dimensionScores: z.array(
    z.object({
      dimension: z.string().min(1).max(200),
      value: z.number().min(0).max(5),
    })
  ).min(1, 'Debe haber al menos una dimensión').max(50, 'Máximo 50 dimensiones'),
  sessionName: z.string().min(1).max(200).optional().default('Sesión'),
  totalRespondents: z.number().int().min(1).max(10000).optional().default(1),
})

export async function POST(request: NextRequest) {
  // Verificar autenticación
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que es admin
  const allowedAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  if (allowedAdmins.length === 0 || !allowedAdmins.includes(user.email || '')) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  // Rate limiting
  const rateLimitResult = await checkAnalysisRateLimit(user.email || user.id)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  // Verificar que al menos una API key esté configurada
  const geminiKey = process.env.GEMINI_API_KEY
  const groqKey = process.env.GROQ_API_KEY

  if (!geminiKey && !groqKey) {
    return NextResponse.json({ error: 'No hay API keys configuradas (GEMINI_API_KEY o GROQ_API_KEY)' }, { status: 500 })
  }

  try {
    const body = await request.json()

    // Validar con Zod
    const parseResult = AnalysisRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { sessionId, dimensionScores, sessionName, totalRespondents } = parseResult.data

    // Cargar contexto del instrumento asociado a la sesión
    let expertisePrompt = ''
    let scaleDescription = 'escala 1-5, donde 1 = Totalmente en desacuerdo y 5 = Totalmente de acuerdo'
    let hasCustomPrompt = false

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('instrument_version_id')
      .eq('id', sessionId)
      .single()

    if (sessionData?.instrument_version_id) {
      const { data: versionData } = await supabase
        .from('instrument_versions')
        .select('scale_labels, instruments(name, ai_expertise_prompt)')
        .eq('id', sessionData.instrument_version_id)
        .single()

      if (versionData) {
        const inst = (versionData as any).instruments
        if (inst?.ai_expertise_prompt) {
          // Sanitizar: limitar longitud a 6000 chars y eliminar intentos de override
          let sanitized = inst.ai_expertise_prompt.slice(0, 6000)
          // Remover patrones comunes de prompt injection
          sanitized = sanitized
            .replace(/ignore.*previous.*instructions/gi, '')
            .replace(/forget.*everything/gi, '')
            .replace(/you are now/gi, '')
            .replace(/new instructions:/gi, '')
          expertisePrompt = sanitized.trim()
          // Si el prompt tiene más de 200 chars, se considera un prompt completo
          // que define su propio formato de respuesta (no usar template genérico)
          hasCustomPrompt = expertisePrompt.length > 200
        }
        if (versionData.scale_labels && Array.isArray(versionData.scale_labels)) {
          const labels = (versionData.scale_labels as any[])
            .sort((a: any, b: any) => a.value - b.value)
            .map((s: any) => `${s.value} = ${s.label}`)
            .join(', ')
          scaleDescription = `escala 1-5, donde ${labels}`
        }
      }
    }

    // Construir el prompt dinámico
    const scoresText = dimensionScores
      .map((d: { dimension: string; value: number }) => `- ${d.dimension}: ${d.value}/5.0`)
      .join('\n')

    // Si el instrumento tiene un prompt personalizado completo, usarlo como base
    // sin el template genérico, para respetar su formato de respuesta.
    // Además, cargar detalle por pregunta para que la IA pueda aplicar reglas granulares.
    let prompt: string

    if (hasCustomPrompt) {
      // Cargar detalle por pregunta para prompts personalizados que necesitan datos granulares
      let questionDetail = ''
      if (sessionData?.instrument_version_id) {
        const { data: respondentsData } = await supabase
          .from('respondents')
          .select('id')
          .eq('session_id', sessionId)
          .eq('completed', true)

        if (respondentsData && respondentsData.length > 0) {
          const respondentIds = respondentsData.map(r => r.id)
          const { data: detailedResponses } = await supabase
            .from('responses')
            .select('value, questions(text, display_order, dimensions(name, display_order))')
            .in('respondent_id', respondentIds)

          if (detailedResponses && detailedResponses.length > 0) {
            // Agrupar por dimensión → pregunta con promedio
            const questionScores: Record<string, { dimName: string; dimOrder: number; qText: string; qOrder: number; total: number; count: number }> = {}

            detailedResponses.forEach((r: any) => {
              const dim = r.questions?.dimensions
              const q = r.questions
              if (!dim || !q) return
              const key = `${dim.name}|${q.display_order}`
              if (!questionScores[key]) {
                questionScores[key] = {
                  dimName: dim.name,
                  dimOrder: dim.display_order,
                  qText: q.text,
                  qOrder: q.display_order,
                  total: 0,
                  count: 0,
                }
              }
              questionScores[key].total += r.value
              questionScores[key].count += 1
            })

            // Formatear como texto agrupado por dimensión
            const grouped = Object.values(questionScores)
              .sort((a, b) => a.dimOrder - b.dimOrder || a.qOrder - b.qOrder)

            let currentDim = ''
            const lines: string[] = []
            grouped.forEach(q => {
              if (q.dimName !== currentDim) {
                currentDim = q.dimName
                lines.push(`\n### ${q.dimName}`)
              }
              const avg = Math.round((q.total / q.count) * 10) / 10
              lines.push(`  ${q.qOrder}. "${q.qText}" → ${avg}/5.0`)
            })

            questionDetail = `\n\nDetalle por pregunta (promedio de ${respondentsData.length} participante(s)):\n${lines.join('\n')}`
          }
        }
      }

      prompt = `${expertisePrompt}

---
## DATOS DE LA EVALUACIÓN

Sesión: "${sessionName}"
Participantes: ${totalRespondents}
Escala: ${scaleDescription}

Resultados consolidados (promedio por dimensión):

${scoresText}
${questionDetail}

---
Genera tu análisis completo en español siguiendo el formato definido arriba.`
    } else {
      const fallbackExpertise = expertisePrompt || 'Eres un consultor experto. Analiza los resultados de esta evaluación.'
      prompt = `${fallbackExpertise}

Analiza los siguientes resultados de una evaluación realizada a ${totalRespondents} participante(s) de la sesión "${sessionName}".

Los resultados consolidados (promedio en ${scaleDescription}) son:

${scoresText}

Genera un análisis ejecutivo en español que incluya:

1. **Resumen General**: Una evaluación global del estado actual según los resultados.

2. **Fortalezas Identificadas**: Las dimensiones con mejor desempeño y qué implica para la organización.

3. **Áreas de Oportunidad**: Las dimensiones con menor desempeño y los riesgos asociados.

4. **Recomendaciones Prioritarias**: 3-5 acciones concretas y prácticas para mejorar, priorizadas por impacto.

5. **Hoja de Ruta Sugerida**: Una secuencia lógica de mejora a corto (1-3 meses), mediano (3-6 meses) y largo plazo (6-12 meses).

El tono debe ser profesional pero accesible, orientado a líderes de negocio y TI.`
    }

    let analysisText = ''

    // Intentar con Gemini primero, fallback a Groq
    if (geminiKey) {
      analysisText = await tryGemini(geminiKey, prompt)
    }

    if (!analysisText && groqKey) {
      analysisText = await tryGroq(groqKey, prompt)
    }

    if (!analysisText) {
      return NextResponse.json(
        { error: 'No se pudo generar el análisis. Ambos proveedores fallaron. Intenta de nuevo en unos minutos.' },
        { status: 503 }
      )
    }

    // Guardar el análisis en la base de datos
    const { error: saveError } = await supabase
      .from('session_analyses')
      .upsert({
        session_id: sessionId,
        analysis_text: analysisText,
        generated_at: new Date().toISOString(),
        generated_by: user.email,
        total_respondents: totalRespondents,
      }, { onConflict: 'session_id' })

    if (saveError) {
      logger.error('Error guardando análisis', 'api/analysis', saveError)
      return NextResponse.json({
        analysis: analysisText,
        saveWarning: `Análisis generado pero no guardado: ${saveError.message}`
      })
    }

    return NextResponse.json({ analysis: analysisText, saved: true })
  } catch (error: any) {
    logger.error('Error generando análisis', 'api/analysis', error)
    return NextResponse.json(
      { error: 'Error al generar el análisis. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}

async function tryGemini(apiKey: string, prompt: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    let attempts = 0
    while (attempts < 2) {
      try {
        const result = await model.generateContent(prompt)
        return result.response.text()
      } catch (err: any) {
        attempts++
        if (err?.status === 429 && attempts < 2) {
          await new Promise(resolve => setTimeout(resolve, 3000))
          continue
        }
        throw err
      }
    }
    return ''
  } catch (error) {
    logger.warn('Gemini falló, intentando fallback', 'api/analysis', error)
    return ''
  }
}

async function tryGroq(apiKey: string, prompt: string): Promise<string> {
  try {
    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Eres un consultor experto en Arquitectura Empresarial. Responde siempre en español.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 3000,
    })

    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    logger.error('Groq falló', 'api/analysis', error)
    return ''
  }
}
