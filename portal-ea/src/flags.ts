import { flag } from 'flags/next'
import { vercelAdapter } from '@flags-sdk/vercel'

export const multiInstrument = flag<boolean>({
  key: 'multi-instrument',
  defaultValue: false,
  description: 'Habilita la gestión multi-instrumento (catálogo, versionamiento, selector)',
  adapter: vercelAdapter(),
})
