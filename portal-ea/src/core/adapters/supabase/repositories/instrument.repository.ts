import type { SupabaseClient } from '@supabase/supabase-js'
import type { InstrumentRepository } from '../../../ports/repositories/instrument.repository'
import type { InstrumentWithVersion, InstrumentVersion, CreateInstrumentDTO, CreateVersionDTO } from '../../../types/dtos'
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

    return ok((data || []).map(this.mapToInstrumentWithVersion))
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
        is_active: data.isActive ?? false,
      })
      .select()
      .single()

    if (error) {
      return err(new InternalError('Error al crear versión', { table: 'instrument_versions' }))
    }

    return ok(this.mapToVersion(created))
  }

  private mapToInstrumentWithVersion(row: Record<string, unknown>): InstrumentWithVersion {
    const versions = (row.instrument_versions as Record<string, unknown>[]) || []
    const activeVersion = versions.find((v) => v.is_active === true) || null

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
      isActive: row.is_active as boolean,
    }
  }
}
