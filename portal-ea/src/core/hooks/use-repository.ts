'use client'

import { useMemo } from 'react'
import { getClientContainer } from '../client-container'
import { TOKENS } from '../types/tokens'
import type { SessionRepository } from '../ports/repositories/session.repository'
import type { RespondentRepository } from '../ports/repositories/respondent.repository'
import type { ResponseRepository } from '../ports/repositories/response.repository'
import type { DimensionRepository } from '../ports/repositories/dimension.repository'
import type { InstrumentRepository } from '../ports/repositories/instrument.repository'
import type { ProfileRepository } from '../ports/repositories/profile.repository'
import type { TenantRepository } from '../ports/repositories/tenant.repository'
import type { AnalysisRepository } from '../ports/repositories/analysis.repository'

/**
 * Hooks de acceso a repositorios para client components.
 * Resuelven el repositorio del ClientContainer (singleton, browser client).
 *
 * Uso:
 *   const { sessionRepo } = useRepositories()
 *   const result = await sessionRepo.findAll()
 */

export function useRepositories() {
  const container = useMemo(() => getClientContainer(), [])

  return useMemo(() => ({
    sessionRepo: container.resolve(TOKENS.SessionRepository) as SessionRepository,
    respondentRepo: container.resolve(TOKENS.RespondentRepository) as RespondentRepository,
    responseRepo: container.resolve(TOKENS.ResponseRepository) as ResponseRepository,
    dimensionRepo: container.resolve(TOKENS.DimensionRepository) as DimensionRepository,
    instrumentRepo: container.resolve(TOKENS.InstrumentRepository) as InstrumentRepository,
    profileRepo: container.resolve(TOKENS.ProfileRepository) as ProfileRepository,
    tenantRepo: container.resolve(TOKENS.TenantRepository) as TenantRepository,
    analysisRepo: container.resolve(TOKENS.AnalysisRepository) as AnalysisRepository,
  }), [container])
}

/**
 * Hook individual para un solo repositorio.
 * Más ligero si solo necesitas uno.
 *
 * Uso:
 *   const sessionRepo = useSessionRepository()
 */
export function useSessionRepository(): SessionRepository {
  const container = useMemo(() => getClientContainer(), [])
  return useMemo(() => container.resolve(TOKENS.SessionRepository) as SessionRepository, [container])
}

export function useRespondentRepository(): RespondentRepository {
  const container = useMemo(() => getClientContainer(), [])
  return useMemo(() => container.resolve(TOKENS.RespondentRepository) as RespondentRepository, [container])
}

export function useResponseRepository(): ResponseRepository {
  const container = useMemo(() => getClientContainer(), [])
  return useMemo(() => container.resolve(TOKENS.ResponseRepository) as ResponseRepository, [container])
}

export function useInstrumentRepository(): InstrumentRepository {
  const container = useMemo(() => getClientContainer(), [])
  return useMemo(() => container.resolve(TOKENS.InstrumentRepository) as InstrumentRepository, [container])
}

export function useProfileRepository(): ProfileRepository {
  const container = useMemo(() => getClientContainer(), [])
  return useMemo(() => container.resolve(TOKENS.ProfileRepository) as ProfileRepository, [container])
}

export function useTenantRepository(): TenantRepository {
  const container = useMemo(() => getClientContainer(), [])
  return useMemo(() => container.resolve(TOKENS.TenantRepository) as TenantRepository, [container])
}
