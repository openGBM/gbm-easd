import type { SupabaseClient } from '@supabase/supabase-js'
import type { InstrumentRepository } from '../../../ports/repositories/instrument.repository'
import type { InstrumentWithVersion, InstrumentVersion, CreateInstrumentDTO, CreateVersionDTO, InstrumentVersionWithDetails, InstrumentWithAllVersions } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { NotFoundError, InternalError, type DomainError } from '../../../errors/domain-errors'

export class SupabaseInstrumentRepository implements InstrumentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<Result<InstrumentWithVersion[], never>> {
    const { data, error } = await this.client
      .from('instruments')
      .select(`
        *,
        instrument_versions(*)
      `)

    if (error) {
      return ok([])
    }

    return ok((data || []).map((row) => this.mapToInstrumentWithVersion(row)))
  }

  async findById(id: string): Promise<Result<InstrumentWithVersion, NotFoundError>> {
    const { data, error } = await this.client
      .from('instruments')
      .select(`
        *,
        instrument_versions(*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return err(new NotFoundError('Instrumento no encontrado', { table: 'instruments', id }))
    }

    return ok(this.mapToInstrumentWithVersion(data))
  }

  async findActiveVersion(instrumentId: string): Promise<Result<InstrumentVersion, NotFoundError>> {
    const { data, error } = await this.client
      .from('instrument_versions')
      .select('*')
      .eq('instrument_id', instrumentId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return err(new NotFoundError('Versión activa no encontrada', { table: 'instrument_versions', instrumentId }))
    }

    return ok(this.mapToVersion(data))
  }

  async create(data: CreateInstrumentDTO): Promise<Result<InstrumentWithVersion, DomainError>> {
    const { data: created, error } = await this.client
      .from('instruments')
      .insert({
        name: data.name,
        description: data.description ?? null,
        ai_expertise_prompt: data.aiExpertisePrompt ?? null,
      })
      .select()
      .single()

    if (error) {
      return err(new InternalError('Error al crear instrumento', { table: 'instruments' }))
    }

    return ok({
      id: created.id as string,
      name: created.name as string,
      description: (created.description as string) || null,
      createdAt: created.created_at as string,
      activeVersion: null,
    })
  }

  async createVersion(data: CreateVersionDTO): Promise<Result<InstrumentVersion, DomainError>> {
    const { data: created, error } = await this.client
      .from('instrument_versions')
      .insert({
        instrument_id: data.instrumentId,
        version_number: data.versionNumber,
        version_tag: data.versionTag ?? String(data.versionNumber),
        is_current: data.isCurrent ?? false,
        is_active: data.isActive ?? false,
        scale_labels: data.scaleLabels ?? null,
        maturity_levels: data.maturityLevels ?? null,
      })
      .select()
      .single()

    if (error) {
      return err(new InternalError('Error al crear versión', { table: 'instrument_versions' }))
    }

    return ok(this.mapToVersion(created))
  }

  async findVersionWithInstrument(versionId: string): Promise<Result<InstrumentVersionWithDetails, NotFoundError>> {
    const { data, error } = await this.client
      .from('instrument_versions')
      .select('*, instruments(name, description)')
      .eq('id', versionId)
      .single()

    if (error || !data) {
      return err(new NotFoundError('Versión no encontrada', { table: 'instrument_versions', id: versionId }))
    }

    return ok({
      id: data.id as string,
      instrumentName: (data as any).instruments?.name || '',
      instrumentDescription: (data as any).instruments?.description || null,
      versionTag: (data.version_tag as string) || null,
      scaleLabels: (data.scale_labels as unknown[]) || null,
      maturityLevels: (data.maturity_levels as unknown[]) || null,
    })
  }

  async findActiveForSessionCreation(): Promise<Result<InstrumentWithVersion[], DomainError>> {
    const { data } = await this.client
      .from('instruments')
      .select('*, instrument_versions(*)')
      .eq('is_active', true)
      .neq('visibility', 'template')
      .order('name')

    if (!data) return ok([])
    return ok(data.map((row) => this.mapToInstrumentWithVersion(row)))
  }

  async findAllWithVersions(): Promise<Result<InstrumentWithAllVersions[], DomainError>> {
    const { data } = await this.client
      .from('instruments')
      .select('*, instrument_versions(*)')
      .order('created_at', { ascending: false })

    if (!data) return ok([])

    return ok(data.map((row: any) => {
      const versions = (row.instrument_versions || []).map((v: any) => this.mapToVersion(v))
      const currentVersion = versions.find((v: any) => v.isCurrent) || null
      return {
        id: row.id as string,
        name: row.name as string,
        description: (row.description as string) || null,
        createdAt: row.created_at as string,
        versions,
        currentVersion,
      }
    }))
  }

  async findVersionDetails(versionId: string): Promise<Result<{ scaleLabels: unknown; maturityLevels: unknown }, NotFoundError>> {
    const { data, error } = await this.client
      .from('instrument_versions')
      .select('scale_labels, maturity_levels')
      .eq('id', versionId)
      .single()

    if (error || !data) {
      return err(new NotFoundError('Versión no encontrada', { table: 'instrument_versions', id: versionId }))
    }

    return ok({
      scaleLabels: data.scale_labels,
      maturityLevels: data.maturity_levels,
    })
  }

  async countActive(): Promise<Result<number, DomainError>> {
    const { count } = await this.client
      .from('instruments')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    return ok(count || 0)
  }

  private mapToInstrumentWithVersion(row: Record<string, unknown>): InstrumentWithVersion {
    const versions = (row.instrument_versions as Record<string, unknown>[]) || []
    // La tabla usa 'is_current' (no 'is_active') para la versión activa
    const activeVersion = versions.find((v) => v.is_current === true) || null

    return {
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) || null,
      createdAt: row.created_at as string,
      activeVersion: activeVersion ? this.mapToVersion(activeVersion) : null,
    }
  }

  private mapToVersion(row: Record<string, unknown>): InstrumentVersion {
    return {
      id: row.id as string,
      instrumentId: row.instrument_id as string,
      versionNumber: row.version_number as number,
      isActive: (row.is_current as boolean) || false,
      isCurrent: (row.is_current as boolean) || false,
    }
  }
}
