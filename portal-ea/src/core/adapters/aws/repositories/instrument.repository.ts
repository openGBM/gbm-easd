// TODO: Replace with actual AWS SDK implementation
import type { InstrumentRepository } from '../../../ports/repositories/instrument.repository'
import type { InstrumentWithVersion, InstrumentVersion, CreateInstrumentDTO, CreateVersionDTO } from '../../../types/dtos'
import type { Result } from '../../../errors/result'
import type { DomainError, NotFoundError } from '../../../errors/domain-errors'
import { err } from '../../../errors/result'
import { ServiceUnavailableError, NotFoundError as NotFoundErrorClass } from '../../../errors/domain-errors'

export class AwsInstrumentRepository implements InstrumentRepository {
  findAll(): Promise<Result<InstrumentWithVersion[], DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  findById(_id: string): Promise<Result<InstrumentWithVersion, NotFoundError>> {
    return Promise.resolve(err(new NotFoundErrorClass('AWS adapter no implementado')))
  }

  findActiveVersion(_instrumentId: string): Promise<Result<InstrumentVersion, NotFoundError>> {
    return Promise.resolve(err(new NotFoundErrorClass('AWS adapter no implementado')))
  }

  create(_data: CreateInstrumentDTO): Promise<Result<InstrumentWithVersion, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }

  createVersion(_data: CreateVersionDTO): Promise<Result<InstrumentVersion, DomainError>> {
    return Promise.resolve(err(new ServiceUnavailableError('AWS adapter no implementado')))
  }
}
