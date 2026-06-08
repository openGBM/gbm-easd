'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  url: string
  size?: number
}

export default function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeSVG value={url} size={size} />
      <p className="text-xs text-gray-500 break-all max-w-[200px] text-center">
        {url}
      </p>
    </div>
  )
}
