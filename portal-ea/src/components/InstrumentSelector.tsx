'use client'

import { InstrumentWithVersion } from '@/types/database'

interface InstrumentSelectorProps {
  instruments: InstrumentWithVersion[]
  selectedId: string
  onChange: (instrumentId: string) => void
}

export default function InstrumentSelector({ instruments, selectedId, onChange }: InstrumentSelectorProps) {
  return (
    <div>
      <label htmlFor="instrument-select" className="block text-sm font-medium text-gray-700 mb-1">
        Instrumento
      </label>
      <select
        id="instrument-select"
        value={selectedId}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {instruments.map(inst => (
          <option key={inst.id} value={inst.id}>
            {inst.name} {inst.current_version ? `(v${inst.current_version.version_tag})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
