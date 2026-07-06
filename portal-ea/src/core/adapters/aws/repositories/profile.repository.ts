// TODO: Replace with actual AWS SDK implementation
import type { ProfileRepository } from '../../../ports/repositories/profile.repository'
import type { Profile, CreateProfileDTO, UpdateProfileDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError, NotFoundError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError, NotFoundError as NotFoundErrorClass } from '../../../errors/domain-errors'

export class AwsProfileRepository implements ProfileRepository {
  findById(_userId: string): Promise<Result<Profile, NotFoundError>> {
    return Promise.resolve(err(new NotFoundErrorClass('AWS adapter no implementado')))
  }

  findByTenantId(_tenantId: string): Promise<Result<Profile[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findAll(): Promise<Result<Profile[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  create(_data: CreateProfileDTO): Promise<Result<Profile, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  update(_userId: string, _data: UpdateProfileDTO): Promise<Result<Profile, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  deactivate(_userId: string): Promise<Result<void, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
