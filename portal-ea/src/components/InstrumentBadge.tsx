interface InstrumentBadgeProps {
  instrumentName: string
  versionTag: string
}

export default function InstrumentBadge({ instrumentName, versionTag }: InstrumentBadgeProps) {
  // Tomar solo las primeras 2-3 letras del nombre como abreviación
  const abbr = instrumentName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
      <span>{abbr}</span>
      <span className="text-indigo-400">·</span>
      <span>v{versionTag}</span>
    </span>
  )
}
