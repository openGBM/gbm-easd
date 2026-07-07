import type { SupabaseClient } from '@supabase/supabase-js'
import type { ViewerLinkRepository } from '../../../ports/repositories/viewer-link.repository'
import type { ViewerLink, CreateViewerLinkDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import { ok, err } from '../../../errors/result'
import { NotFoundError, InternalError, type DomainError } from '../../../errors/domain-errors'

export class SupabaseViewerLinkRepository implements ViewerLinkRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(data: CreateViewerLinkDTO): Promise<Result<ViewerLink, DomainError>> {
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + data.expiresInHours)

    const { data: created, error } = await this.client
      .from('viewer_links')
      .insert({
        token,
        session_id: data.sessionId,
        expires_at: expiresAt.toISOString(),
        created_by: data.createdBy,
      })
      .select()
      .single()

    if (error) {
      return err(new InternalError('Error al crear enlace de visualización', { table: 'viewer_links' }))
    }

    return ok(this.mapToViewerLink(created))
  }

  async findByToken(token: string): Promise<Result<ViewerLink, NotFoundError>> {
    const { data, error } = await this.client
      .from('viewer_links')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) {
      return err(new NotFoundError('Enlace no encontrado', { table: 'viewer_links', token }))
    }

    return ok(this.mapToViewerLink(data))
  }

  async revoke(token: string): Promise<Result<void, NotFoundError>> {
    const { error } = await this.client
      .from('viewer_links')
      .update({ is_revoked: true })
      .eq('token', token)

    if (error) {
      return err(new NotFoundError('Enlace no encontrado', { table: 'viewer_links', token }))
    }

    return ok(undefined)
  }

  async isValid(token: string): Promise<Result<boolean, never>> {
    const { data, error } = await this.client
      .from('viewer_links')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) {
      return ok(false)
    }

    const link = this.mapToViewerLink(data)
    const isExpired = new Date(link.expiresAt) < new Date()
    const isRevoked = link.isRevoked

    return ok(!isExpired && !isRevoked)
  }

  private mapToViewerLink(row: Record<string, unknown>): ViewerLink {
    return {
      token: row.token as string,
      sessionId: row.session_id as string,
      expiresAt: row.expires_at as string,
      isRevoked: row.is_revoked as boolean,
      createdBy: row.created_by as string,
    }
  }
}
