import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

export async function POST(request: NextRequest) {
  // Verificar autenticación
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que es admin
  const allowedAdmins = (process.env.ADMIN_EMAILS || 'admin@gbm.net').split(',').map(e => e.trim())
  if (!allowedAdmins.includes(user.email || '')) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  // Verificar que al menos una API key esté configurada
  const geminiKey = process.env.GEMINI_API_KEY
  const groqKey = process.env.GROQ_API_KEY

  if (!geminiKey && !groqKey) {
    return NextResponse.json({ error: 'No hay API keys configuradas (GEMINI_API_KEY o GROQ_API_KEY)' }, { status: 500 })
  }

  try {
    const { sessionId, dimensionScores, sessionName, totalRespondents } = await request.json()

    if (!sessionId || !dimensionScores || !Array.isArray(dimensionScores)) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Cargar contexto del instrumento asociado a la sesión
    let expertisePrompt = 'Eres un consultor experto. Analiza los resultados de esta evaluación.'
    let scaleDescription = 'escala 1-5, donde 1 = Totalmente en desacuerdo y 5 = Totalmente de acuerdo'

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
          expertisePrompt = inst.ai_expertise_prompt
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

    const prompt = `${expertisePrompt}

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
      console.error('Error guardando análisis:', saveError)
      return NextResponse.json({
        analysis: analysisText,
        saveWarning: `Análisis generado pero no guardado: ${saveError.message}`
      })
    }

    return NextResponse.json({ analysis: analysisText, saved: true })
  } catch (error: any) {
    console.error('Error generando análisis:', error)
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
    console.error('Gemini falló, intentando fallback:', error)
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
    console.error('Groq falló:', error)
    return ''
  }
}
