import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProfileRepository } from '../../../ports/repositories/profile.repository'
import type { Profile, CreateProfileDTO, UpdateProfileDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { NotFoundError, InternalError, type DomainError } from '../../../errors/domain-errors'

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(userId: string): Promise<Result<Profile, NotFoundError>> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return err(new NotFoundError('Perfil no encontrado', { table: 'profiles', id: userId }))
    }

    return ok(this.mapToProfile(data))
  }

  async findByTenantId(tenantId: string): Promise<Result<Profile[], never>> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) {
      return ok([])
    }

    return ok((data || []).map(this.mapToProfile))
  }

  async findAll(): Promise<Result<Profile[], never>> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')

    if (error) {
      return ok([])
    }

    return ok((data || []).map(this.mapToProfile))
  }

  async create(data: CreateProfileDTO): Promise<Result<Profile, DomainError>> {
    const { data: created, error } = await this.client
      .from('profiles')
      .insert({
        id: data.id,
        email: data.email,
        role: data.role,
        tenant_id: data.tenantId ?? null,
        display_name: data.displayName ?? null,
      })
      .select()
      .single()

    if (error) {
      return err(new InternalError('Error al crear perfil', { table: 'profiles' }))
    }

    return ok(this.mapToProfile(created))
  }

  async update(userId: string, data: UpdateProfileDTO): Promise<Result<Profile, NotFoundError>> {
    const updateData: Record<string, unknown> = {}
    if (data.role !== undefined) updateData.role = data.role
    if (data.tenantId !== undefined) updateData.tenant_id = data.tenantId
    if (data.displayName !== undefined) updateData.display_name = data.displayName
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { data: updated, error } = await this.client
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error || !updated) {
      return err(new NotFoundError('Perfil no encontrado', { table: 'profiles', id: userId }))
    }

    return ok(this.mapToProfile(updated))
  }

  async deactivate(userId: string): Promise<Result<void, NotFoundError>> {
    const { error } = await this.client
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId)

    if (error) {
      return err(new NotFoundError('Perfil no encontrado', { table: 'profiles', id: userId }))
    }

    return ok(undefined)
  }

  private mapToProfile(row: Record<string, unknown>): Profile {
    return {
      id: row.id as string,
      email: row.email as string,
      role: row.role as Profile['role'],
      tenantId: (row.tenant_id as string) || null,
      isActive: row.is_active as boolean,
      displayName: (row.display_name as string) || null,
    }
  }
}
