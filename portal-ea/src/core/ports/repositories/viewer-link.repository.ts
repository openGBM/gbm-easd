import type { Result } from '../../errors'
import type { DomainError, NotFoundError } from '../../errors'
import type { ViewerLink, CreateViewerLinkDTO } from '../../types/dtos'

export interface ViewerLinkRepository {
  create(data: CreateViewerLinkDTO): Promise<Result<ViewerLink, DomainError>>
  findByToken(token: string): Promise<Result<ViewerLink, NotFoundError>>
  revoke(token: string): Promise<Result<void, DomainError>>
  isValid(token: string): Promise<Result<boolean, DomainError>>
}
