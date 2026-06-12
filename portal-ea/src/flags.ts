/**
 * Feature Flags del portal.
 * 
 * Fuente de verdad única para todos los componentes (server y client).
 * En producción: configurar NEXT_PUBLIC_MULTI_INSTRUMENT=true en Vercel env vars.
 * En local: configurar en .env.local.
 */

export function isMultiInstrumentEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MULTI_INSTRUMENT === 'true'
}
