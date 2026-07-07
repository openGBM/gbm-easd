import { NextRequest, NextResponse } from 'next/server'
import { getServerContainer } from '@/core/server-container'
import { TOKENS } from '@/core/types/tokens'
import type { InMemoryMetricsCollector } from '@/core/observability/in-memory-metrics'

/**
 * GET /api/metrics — Expone métricas en formato Prometheus.
 *
 * Protección: Solo admin autenticado (verificación via auth header o session).
 * Formato: text/plain (Prometheus exposition format).
 *
 * Uso con Grafana Cloud (free tier):
 *   Configurar remote_write o scrape apuntando a este endpoint.
 */
export async function GET(request: NextRequest) {
  // Verificación simple de acceso (admin only)
  // TODO (Unit 5): Usar AuthGuard del container
  const { createServerSupabaseClient } = await import('@/lib/supabase/server')
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const allowedAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  if (!allowedAdmins.includes(user.email || '')) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  try {
    const container = getServerContainer()
    const metrics = container.resolve(TOKENS.MetricsCollector) as InMemoryMetricsCollector

    // Si el collector tiene método toPrometheus, usarlo
    if ('toPrometheus' in metrics && typeof metrics.toPrometheus === 'function') {
      const prometheusText = metrics.toPrometheus()
      return new NextResponse(prometheusText, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // Fallback: retornar JSON
    const snapshot = metrics.getMetrics()
    return NextResponse.json(snapshot)
  } catch {
    return NextResponse.json({ error: 'Métricas no disponibles' }, { status: 503 })
  }
}
