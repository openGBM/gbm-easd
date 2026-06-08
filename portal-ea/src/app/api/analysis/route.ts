import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

  // Verificar API key configurada
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })
  }

  try {
    const { sessionId, dimensionScores, sessionName, totalRespondents } = await request.json()

    if (!sessionId || !dimensionScores || !Array.isArray(dimensionScores)) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Construir el prompt con contexto de EA
    const scoresText = dimensionScores
      .map((d: { dimension: string; value: number }) => `- ${d.dimension}: ${d.value}/5.0`)
      .join('\n')

    const prompt = `Eres un consultor experto en Arquitectura Empresarial (EA). Analiza los siguientes resultados de una evaluación de madurez EA realizada a ${totalRespondents} participante(s) de la sesión "${sessionName}".

Los resultados consolidados (promedio en escala 1-5, donde 1 = Totalmente en desacuerdo y 5 = Totalmente de acuerdo) son:

${scoresText}

Escala de madurez por dimensión (suma de 6 preguntas, máx 30):
- 6-13 puntos: Naciente
- 14-23 puntos: Base  
- 24-30 puntos: Clase Mundial

Genera un análisis ejecutivo en español que incluya:

1. **Resumen General**: Una evaluación global del estado de madurez de la arquitectura empresarial.

2. **Fortalezas Identificadas**: Las dimensiones con mejor desempeño y qué implica para la organización.

3. **Áreas de Oportunidad**: Las dimensiones con menor desempeño y los riesgos asociados.

4. **Recomendaciones Prioritarias**: 3-5 acciones concretas y prácticas para mejorar la madurez EA, priorizadas por impacto.

5. **Hoja de Ruta Sugerida**: Una secuencia lógica de mejora a corto (1-3 meses), mediano (3-6 meses) y largo plazo (6-12 meses).

El tono debe ser profesional pero accesible, orientado a líderes de negocio y TI.`

    // Llamar a Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent(prompt)
    const response = result.response
    const analysisText = response.text()

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
      // Si la tabla no existe aún, devolver solo el análisis sin guardar
      console.error('Error guardando análisis:', saveError)
    }

    return NextResponse.json({ analysis: analysisText })
  } catch (error: any) {
    console.error('Error generando análisis:', error)
    return NextResponse.json(
      { error: 'Error al generar el análisis. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
