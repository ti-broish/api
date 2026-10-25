import { EntityNotFoundError, Repository } from 'typeorm'
import { Section } from './section.entity'
import { SectionsRepository } from './sections.repository'
import { TownsRepository } from './towns.repository'

describe('SectionsRepository.findOneOrFail', () => {
  const createQueryBuilder = jest.fn()
  const repo = new SectionsRepository(
    { createQueryBuilder } as unknown as Repository<Section>,
    {} as TownsRepository,
  )

  beforeEach(() => createQueryBuilder.mockReset())

  it.each(['999999999', '000000000', '12345678', 'abcdefghi', ''])(
    'throws not found for %p without querying',
    (id) => {
      expect(() => repo.findOneOrFail(id)).toThrow(EntityNotFoundError)
      expect(createQueryBuilder).not.toHaveBeenCalled()
    },
  )
})
