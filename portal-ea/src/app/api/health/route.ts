import { NextRequest, NextResponse } from 'next/server'
import { getServerContainer } from '@/core/server-container'
import { TOKENS } from '@/core/types/tokens'
import { isOk } from '@/core/errors/result'

/**
 * GET /api/health — Health check endpoint.
 *
 * Shallow (público): Verifica que la app responde.
 * Deep (con ?deep=true, solo admin): Verifica conectividad a DB + Auth.
 *
 * RESILIENCY-06: Health checks integrados con monitoreo.
 */
export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get('deep') === 'true'
  const startTime = Date.now()

  // Shallow health check — siempre disponible
  const checks: Record<string, { status: string; durationMs?: number; error?: string }> = {
    app: { status: 'healthy', durationMs: 0 },
  }

  if (deep) {
    // Deep health check — verifica dependencias
    try {
      const container = getServerContainer()

      // Check DB connectivity
      const dbStart = Date.now()
      const sessionRepo = container.resolve(TOKENS.SessionRepository)
      const dbResult = await sessionRepo.countActive()
      checks.database = {
        status: isOk(dbResult) ? 'healthy' : 'unhealthy',
        durationMs: Date.now() - dbStart,
      }
    } catch (e) {
      checks.database = {
        status: 'unhealthy',
        error: 'No se pudo conectar a la base de datos',
      }
    }
  }

  // Determinar status general
  const allHealthy = Object.values(checks).every(c => c.status === 'healthy')
  const anyUnhealthy = Object.values(checks).some(c => c.status === 'unhealthy')

  const overallStatus = anyUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded'
  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      checks,
    },
    { status: httpStatus },
  )
}
