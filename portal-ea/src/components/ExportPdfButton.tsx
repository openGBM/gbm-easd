'use client'

import { useState } from 'react'

interface ExportPdfButtonProps {
  /** ID del elemento HTML a capturar */
  targetId: string
  /** Nombre del archivo PDF generado */
  fileName?: string
}

export default function ExportPdfButton({ targetId, fileName = 'resultados' }: ExportPdfButtonProps) {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)

    try {
      const element = document.getElementById(targetId)
      if (!element) {
        console.error('Elemento no encontrado:', targetId)
        return
      }

      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      // Capturar el contenido como imagen
      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      } as any)

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Crear PDF en orientación adecuada
      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = 297 // A4 height in mm
      const margin = 10

      const contentWidth = pdfWidth - margin * 2
      const contentHeight = (imgHeight * contentWidth) / imgWidth

      const pdf = new jsPDF({
        orientation: contentHeight > pdfHeight - margin * 2 ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // Si el contenido es más alto que una página, dividir en múltiples páginas
      const pageContentHeight = pdfHeight - margin * 2
      let remainingHeight = contentHeight
      let srcY = 0

      while (remainingHeight > 0) {
        const sliceHeight = Math.min(pageContentHeight, remainingHeight)
        const sliceRatio = sliceHeight / contentHeight

        // Crear canvas temporal con el slice
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = imgWidth
        sliceCanvas.height = Math.round(imgHeight * sliceRatio)

        const ctx = sliceCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, srcY, imgWidth, Math.round(imgHeight * sliceRatio),
            0, 0, imgWidth, Math.round(imgHeight * sliceRatio)
          )
        }

        const sliceData = sliceCanvas.toDataURL('image/png')
        pdf.addImage(sliceData, 'PNG', margin, margin, contentWidth, sliceHeight)

        remainingHeight -= pageContentHeight
        srcY += Math.round(imgHeight * sliceRatio)

        if (remainingHeight > 0) {
          pdf.addPage()
        }
      }

      pdf.save(`${fileName}.pdf`)
    } catch (error) {
      console.error('Error al generar PDF:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 text-sm"
    >
      {exporting ? (
        <>
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
          Generando PDF...
        </>
      ) : (
        <>
          📄 Descargar PDF
        </>
      )}
    </button>
  )
}
