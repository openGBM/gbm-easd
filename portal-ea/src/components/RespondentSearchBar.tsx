'use client'

import { useState } from 'react'

interface RespondentSearchBarProps {
  onSearch: (query: string) => void
  loading: boolean
}

export default function RespondentSearchBar({ onSearch, loading }: RespondentSearchBarProps) {
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim().length >= 2) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar por email o nombre (mínimo 2 caracteres)"
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        minLength={2}
      />
      <button
        type="submit"
        disabled={loading || query.trim().length < 2}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? 'Buscando...' : '🔍 Buscar'}
      </button>
    </form>
  )
}
