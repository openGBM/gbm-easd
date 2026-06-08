'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  url: string
  size?: number
}

export default function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [qrSize, setQrSize] = useState(400)

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

  return (
    <>
      {/* QR normal (clickeable) */}
      <div
        className="flex flex-col items-center gap-2 cursor-pointer"
        onClick={() => setFullscreen(true)}
        title="Clic para ver en pantalla completa"
      >
        <QRCodeSVG value={url} size={size} />
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
            <p className="text-sm text-gray-400">
              Clic en cualquier lugar o presiona Esc para cerrar
            </p>
          </div>
        </div>
      )}
    </>
  )
}
