/**
 * Script para generar el Excel de importación del instrumento
 * "Diagnóstico de Preparación AI-DLC"
 *
 * Ejecutar: npx tsx scripts/generate-aidlc-instrument.ts
 */

import * as ExcelJS from 'exceljs'
import * as path from 'path'

async function main() {
  const wb = new ExcelJS.Workbook()

  // ===================== HOJA 1: Banco de Preguntas =====================
  const ws = wb.addWorksheet('Banco de Preguntas')
  ws.columns = [
    { header: 'Dimensión', key: 'dimension', width: 40 },
    { header: 'Descripción Dimensión', key: 'dimDescription', width: 60 },
    { header: 'Color', key: 'color', width: 10 },
    { header: 'Orden Dimensión', key: 'dimOrder', width: 15 },
    { header: 'Pregunta', key: 'question', width: 100 },
    { header: 'Orden Pregunta', key: 'qOrder', width: 15 },
  ]
  ws.getRow(1).font = { bold: true }

  const dimensions = [
    {
      name: 'Objetivo y Estrategia',
      description: 'La compuerta de producción — evalúa si existe una estrategia clara para llevar iniciativas de software a producción real.',
      color: '#6366F1',
      order: 1,
      questions: [
        'Tenemos una estrategia clara para llevar nuestras iniciativas de software a producción, no solo a pruebas de concepto.',
        'Hemos identificado casos de uso concretos que esperamos poner en producción en los próximos meses.',
        'Como organización nos comprometemos a operar y sostener en producción lo que construyamos.',
        'Definimos el éxito como sistemas en uso real, no como prototipos.',
      ],
    },
    {
      name: 'Respaldo y Continuidad',
      description: 'Combina patrocinio ejecutivo, presupuesto y demanda sostenida de desarrollo.',
      color: '#F59E0B',
      order: 2,
      questions: [
        'La iniciativa cuenta con un patrocinador ejecutivo que la respalda activamente.',
        'Disponemos de presupuesto, asignado o en gestión, para llevarla a producción.',
        'Tenemos una necesidad continua de desarrollar o modernizar software, más allá de un proyecto puntual.',
        'Anticipamos un flujo de requerimientos a lo largo del próximo año.',
      ],
    },
    {
      name: 'Equipo y Disposición al Cambio',
      description: 'Combina capacidad propia (clasifica arquetipo Builder/No-builder, preguntas 1-2) y apertura al cambio (contribuye al compuesto, preguntas 3-4).',
      color: '#10B981',
      order: 3,
      questions: [
        'Contamos con equipos de desarrollo propios capaces de construir software.',
        'Buscamos sostener internamente la capacidad de entrega con el tiempo.',
        'Nuestros equipos están abiertos a nuevas formas de trabajar (desarrollo guiado por especificaciones, IA agéntica).',
        'Hemos adoptado con éxito cambios de proceso o herramientas en el pasado.',
      ],
    },
    {
      name: 'Tecnología y Prácticas de Desarrollo',
      description: 'Stack tecnológico, ciclo de desarrollo, automatización y gobernanza.',
      color: '#8B5CF6',
      order: 4,
      questions: [
        'Nuestro stack está alineado con nube moderna (AWS) o con tecnologías IBM, incluido el legado que buscamos modernizar.',
        'Tenemos un ciclo de desarrollo definido, con control de versiones e integración y entrega continuas.',
        'Nuestras pruebas y despliegues están automatizados en algún grado.',
        'Mantenemos documentación y estándares que un equipo nuevo podría seguir.',
        'Operamos en un sector con exigencias de cumplimiento o gobernanza que el software debe satisfacer.',
      ],
    },
    {
      name: 'Caso de Uso y Viabilidad',
      description: 'Evalúa si existe un caso de uso concreto identificado y las condiciones técnicas mínimas para ejecutarlo.',
      color: '#E85D04',
      order: 5,
      questions: [
        'Tenemos identificado al menos un caso de uso concreto que queremos llevar a producción con AI-DLC.',
        'El caso de uso tiene un dueño de negocio que puede definir criterios de aceptación.',
        'Conocemos las restricciones regulatorias o de seguridad que el caso debe cumplir.',
        'Contamos con infraestructura cloud (AWS u otra) disponible para soportar el desarrollo.',
        'Podemos proveer acceso a herramientas de desarrollo modernas (IDE, repositorios, CI/CD) sin restricciones corporativas bloqueantes.',
      ],
    },
  ]

  dimensions.forEach(dim => {
    dim.questions.forEach((q, idx) => {
      ws.addRow({
        dimension: dim.name,
        dimDescription: dim.description,
        color: dim.color,
        dimOrder: dim.order,
        question: q,
        qOrder: idx + 1,
      })
    })
  })

  // ===================== HOJA 2: Escala =====================
  const wsScale = wb.addWorksheet('Escala')
  wsScale.columns = [
    { header: 'Valor', key: 'value', width: 10 },
    { header: 'Etiqueta', key: 'label', width: 30 },
    { header: 'Descripción', key: 'description', width: 60 },
  ]
  wsScale.getRow(1).font = { bold: true }

  const scale = [
    { value: 1, label: 'Ausente', description: 'No existe evidencia ni intención en esta área' },
    { value: 2, label: 'Incipiente', description: 'Hay ideas o intentos aislados, sin formalización' },
    { value: 3, label: 'Parcial', description: 'Existe de forma parcial o inconsistente' },
    { value: 4, label: 'Establecido', description: 'Está formalizado y operando con regularidad' },
    { value: 5, label: 'Consolidado', description: 'Está maduro, medido y en mejora continua' },
  ]

  scale.forEach(s => wsScale.addRow(s))

  // ===================== HOJA 3: Niveles =====================
  const wsLevels = wb.addWorksheet('Niveles')
  wsLevels.columns = [
    { header: 'Nivel', key: 'label', width: 20 },
    { header: 'Color', key: 'color', width: 10 },
    { header: 'Promedio Mínimo', key: 'minAverage', width: 18 },
    { header: 'Promedio Máximo', key: 'maxAverage', width: 18 },
  ]
  wsLevels.getRow(1).font = { bold: true }

  const levels = [
    { label: 'Exploratorio', color: '#EF4444', minAverage: 1.0, maxAverage: 2.4 },
    { label: 'En preparación', color: '#F59E0B', minAverage: 2.5, maxAverage: 3.4 },
    { label: 'Preparado', color: '#10B981', minAverage: 3.5, maxAverage: 4.4 },
    { label: 'Acelerable', color: '#3B82F6', minAverage: 4.5, maxAverage: 5.0 },
  ]

  levels.forEach(l => wsLevels.addRow(l))

  // ===================== GUARDAR =====================
  const outputPath = path.join(__dirname, '..', '..', 'docs', 'diagnostico-preparacion-aidlc.xlsx')
  await wb.xlsx.writeFile(outputPath)
  console.log(`✅ Excel generado exitosamente: ${outputPath}`)
  console.log(`\n📋 Contenido:`)
  console.log(`   • 5 dimensiones, 22 preguntas`)
  console.log(`   • Escala: Ausente → Consolidado (1-5)`)
  console.log(`   • Niveles: Exploratorio → Acelerable`)
  console.log(`\n🚀 Para importar:`)
  console.log(`   1. Ir a Admin → Instrumentos → Crear "Diagnóstico de Preparación AI-DLC"`)
  console.log(`   2. Gestionar → Importar Excel → Seleccionar este archivo`)
  console.log(`   3. Copiar el AI Expertise Prompt del documento docs/instrumento-diagnostico-aidlc.md`)
}

main().catch(console.error)
