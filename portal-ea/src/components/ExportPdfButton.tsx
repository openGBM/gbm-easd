'use client'

import { useState } from 'react'

interface ExportPdfButtonProps {
  /** ID del elemento HTML a capturar */
  targetId: string
  /** Nombre del archivo PDF generado */
  fileName?: string
  /** Título que aparece en el header del PDF */
  pdfTitle?: string
  /** Subtítulo opcional (ej: nombre del encuestado, fecha) */
  pdfSubtitle?: string
}

export default function ExportPdfButton({
  targetId,
  fileName = 'resultados',
  pdfTitle,
  pdfSubtitle,
}: ExportPdfButtonProps) {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)

    try {
      const element = document.getElementById(targetId)
      if (!element) {
        console.error('Elemento no encontrado:', targetId)
        return
      }

      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')

      // Ocultar elementos marcados con data-pdf-hide antes de capturar
      const hiddenElements = element.querySelectorAll('[data-pdf-hide]')
      hiddenElements.forEach(el => (el as HTMLElement).style.display = 'none')

      // Mostrar elementos marcados con data-pdf-only
      const pdfOnlyElements = element.querySelectorAll('[data-pdf-only]')
      pdfOnlyElements.forEach(el => (el as HTMLElement).style.display = 'block')

      // Capturar el contenido como imagen
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      // Restaurar elementos ocultos
      hiddenElements.forEach(el => (el as HTMLElement).style.display = '')
      pdfOnlyElements.forEach(el => (el as HTMLElement).style.display = 'none')

      // Usar JPEG para reducir tamaño (~80% más liviano que PNG)
      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Crear PDF
      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = 297 // A4 height in mm
      const margin = 10

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      let currentY = margin

      // Header del PDF con título
      if (pdfTitle) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text(pdfTitle, pdfWidth / 2, currentY + 6, { align: 'center' })
        currentY += 10

        if (pdfSubtitle) {
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(100, 100, 100)
          pdf.text(pdfSubtitle, pdfWidth / 2, currentY + 4, { align: 'center' })
          currentY += 8
          pdf.setTextColor(0, 0, 0)
        }

        currentY += 4
      }

      const contentWidth = pdfWidth - margin * 2
      const contentHeight = (imgHeight * contentWidth) / imgWidth

      // Si el contenido cabe en una página (considerando header)
      const availableHeight = pdfHeight - currentY - margin
      
      if (contentHeight <= availableHeight) {
        pdf.addImage(imgData, 'JPEG', margin, currentY, contentWidth, contentHeight)
      } else {
        // Multipágina: dividir imagen en slices
        let remainingHeight = contentHeight
        let srcY = 0
        let isFirstPage = true

        while (remainingHeight > 0) {
          const pageAvailable = isFirstPage ? availableHeight : pdfHeight - margin * 2
          const sliceHeight = Math.min(pageAvailable, remainingHeight)
          const sliceRatio = sliceHeight / contentHeight

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

          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.85)
          const yPos = isFirstPage ? currentY : margin
          pdf.addImage(sliceData, 'JPEG', margin, yPos, contentWidth, sliceHeight)

          remainingHeight -= pageAvailable
          srcY += Math.round(imgHeight * sliceRatio)

          if (remainingHeight > 0) {
            pdf.addPage()
          }
          isFirstPage = false
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
      data-pdf-hide
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 text-sm"
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
