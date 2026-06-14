'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  url: string
  size?: number
}

export default function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [qrSize, setQrSize] = useState(400)
  const [copied, setCopied] = useState<'url' | 'qr' | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (fullscreen) {
      const updateSize = () => {
        setQrSize(Math.min(window.innerWidth, window.innerHeight) * 0.6)
      }
      updateSize()
      window.addEventListener('resize', updateSize)
      return () => window.removeEventListener('resize', updateSize)
    }
  }, [fullscreen])

  // Cerrar con Escape
  useEffect(() => {
    if (!fullscreen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [fullscreen])

  async function copyUrl() {
    await navigator.clipboard.writeText(url)
    setCopied('url')
    setTimeout(() => setCopied(null), 2000)
  }

  async function copyQR() {
    const svgElement = qrRef.current?.querySelector('svg')
    if (!svgElement) return

    // Convertir SVG a PNG via canvas
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = async () => {
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      ctx!.fillStyle = '#ffffff'
      ctx!.fillRect(0, 0, canvas.width, canvas.height)
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ])
          setCopied('qr')
          setTimeout(() => setCopied(null), 2000)
        }
      }, 'image/png')
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <>
      {/* QR normal con botones de acción */}
      <div className="flex flex-col items-center gap-2">
        <div
          ref={qrRef}
          className="cursor-pointer"
          onClick={() => setFullscreen(true)}
          title="Clic para ver en pantalla completa"
        >
          <QRCodeSVG value={url} size={size} />
        </div>

        {/* Botones de copiar */}
        <div className="flex gap-1">
          <button
            onClick={copyUrl}
            className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Copiar URL"
          >
            {copied === 'url' ? '✓ Copiado' : '🔗 URL'}
          </button>
          <button
            onClick={copyQR}
            className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Copiar QR como imagen"
          >
            {copied === 'qr' ? '✓ Copiado' : '📋 QR'}
          </button>
        </div>

        <p className="text-xs text-gray-500 break-all max-w-[200px] text-center">
          {url}
        </p>
      </div>

      {/* Modal pantalla completa */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
          onClick={() => setFullscreen(false)}
        >
          {/* Botón cerrar */}
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 text-4xl font-light transition-colors"
            aria-label="Cerrar pantalla completa"
          >
            ✕
          </button>

          {/* QR grande */}
          <div className="flex flex-col items-center gap-8">
            <QRCodeSVG value={url} size={qrSize} />
            <p className="text-2xl text-gray-700 font-medium text-center px-8 break-all">
              {url}
            </p>
            <div className="flex gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); copyUrl() }}
                className="px-4 py-2 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {copied === 'url' ? '✓ URL copiada' : '🔗 Copiar URL'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); copyQR() }}
                className="px-4 py-2 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {copied === 'qr' ? '✓ QR copiado' : '📋 Copiar QR'}
              </button>
            </div>
            <p className="text-sm text-gray-400">
              Clic en cualquier lugar o presiona Esc para cerrar
            </p>
          </div>
        </div>
      )}
    </>
  )
}
