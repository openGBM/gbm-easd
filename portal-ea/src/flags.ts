import { flag } from 'flags/next'

export const multiInstrument = flag<boolean>({
  key: 'multi-instrument',
  defaultValue: false,
  description: 'Habilita la gestión multi-instrumento (catálogo, versionamiento, selector)',
  decide() {
    // En desarrollo local: override via env var
    if (process.env.MULTI_INSTRUMENT === 'true') return true
    // Default: desactivado (comportamiento v1.x)
    return this.defaultValue as boolean
  },
})
