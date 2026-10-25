import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  ViolationSectionDto,
  VIOLATION_SECTION_INVALID_FORMAT,
} from './violation-section.dto'

describe('ViolationSectionDto', () => {
  const errorsFor = async (body: unknown) =>
    (
      await validate(
        plainToInstance(ViolationSectionDto, body as Record<string, unknown>),
      )
    ).flatMap((error) => Object.values(error.constraints || {}))

  it('accepts a 9-digit section id', async () => {
    expect(await errorsFor({ section: '234602012' })).toEqual([])
  })

  it.each([
    [{}],
    [{ section: '' }],
    [{ section: '23460201' }],
    [{ section: '2346020120' }],
    [{ section: '23460201a' }],
    [{ section: 234602012 }],
  ])('rejects %j with a translatable format error', async (body) => {
    const errors = await errorsFor(body)
    expect(errors.length).toBeGreaterThan(0)
    expect(new Set(errors)).toEqual(new Set([VIOLATION_SECTION_INVALID_FORMAT]))
  })
})
