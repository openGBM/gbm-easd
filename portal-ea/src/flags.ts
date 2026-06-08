/**
 * Feature Flags del portal.
 * 
 * En producción (Vercel): configurar NEXT_PUBLIC_MULTI_INSTRUMENT=true en env vars.
 * En local: configurar en .env.local.
 * 
 * El flag es público (NEXT_PUBLIC_) para que funcione tanto en server components
 * como en client components de forma consistente.
 */

export function isMultiInstrumentEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MULTI_INSTRUMENT === 'true'
}
