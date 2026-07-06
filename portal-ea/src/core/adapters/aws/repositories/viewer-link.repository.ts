// TODO: Replace with actual AWS SDK implementation
import type { ViewerLinkRepository } from '../../../ports/repositories/viewer-link.repository'
import type { ViewerLink, CreateViewerLinkDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError, NotFoundError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError, NotFoundError as NotFoundErrorClass } from '../../../errors/domain-errors'

export class AwsViewerLinkRepository implements ViewerLinkRepository {
  create(_data: CreateViewerLinkDTO): Promise<Result<ViewerLink, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findByToken(_token: string): Promise<Result<ViewerLink, NotFoundError>> {
    return Promise.resolve(err(new NotFoundErrorClass('AWS adapter no implementado')))
  }

  revoke(_token: string): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  isValid(_token: string): Promise<Result<boolean, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
