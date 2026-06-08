import { flag } from 'flags/next'
import { vercelAdapter } from '@flags-sdk/vercel'

export const multiInstrument = flag<boolean>({
  key: 'multi-instrument',
  defaultValue: false,
  description: 'Habilita la gestión multi-instrumento (catálogo, versionamiento, selector)',
  adapter: vercelAdapter(),
  decide() {
    // Override local via env var (desarrollo sin Vercel Dashboard)
    if (process.env.NEXT_PUBLIC_MULTI_INSTRUMENT === 'true') return true
    if (process.env.NEXT_PUBLIC_MULTI_INSTRUMENT === 'false') return false
    // En producción: usa el valor del Vercel Flags Dashboard
    return this.defaultValue as boolean
  },
})
