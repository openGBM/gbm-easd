import type { Result } from '../../errors'
import type { DomainError, NotFoundError } from '../../errors'
import type { Profile, CreateProfileDTO, UpdateProfileDTO } from '../../types/dtos'

export interface ProfileRepository {
  findById(userId: string): Promise<Result<Profile, NotFoundError>>
  findByTenantId(tenantId: string): Promise<Result<Profile[], DomainError>>
  findAll(): Promise<Result<Profile[], DomainError>>
  create(data: CreateProfileDTO): Promise<Result<Profile, DomainError>>
  update(userId: string, data: UpdateProfileDTO): Promise<Result<Profile, DomainError>>
  deactivate(userId: string): Promise<Result<void, DomainError>>
}
