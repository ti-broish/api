import { Section, Town } from '../../sections/entities'
import { User } from '../../users/entities'
import { Violation, ViolationStatus } from './violation.entity'
import { ViolationUpdateType } from './violation-update.entity'
import { ViolationSectionException } from './violation.exceptions'

describe('Violation section', () => {
  const actor = Object.assign(new User(), { id: 'actor-id' })
  const sofiaMunicipality = { id: 1, code: '46', name: 'Столична' }
  const otherMunicipality = { id: 2, code: '01', name: 'Друга' }

  const town = (id: number, municipality = sofiaMunicipality): Town =>
    Object.assign(new Town(), {
      id,
      code: id * 10,
      name: `town-${id}`,
      municipality,
    })

  const section = (id: string, sectionTown: Town): Section =>
    Object.assign(new Section(), { id, town: sectionTown })

  const sofia = town(1)

  const violationIn = (violationTown: Town, current?: Section): Violation => {
    const violation = new Violation()
    violation.status = ViolationStatus.PROCESSING
    violation.isPublished = false
    violation.town = violationTown
    violation.section = current
    violation.updates = []
    return violation
  }

  it('sets a section on a violation without one and logs it', () => {
    const violation = violationIn(sofia)
    violation.setSection(actor, section('234602012', sofia))

    expect(violation.section.id).toBe('234602012')
    expect(violation.town).toBe(sofia)
    expect(violation.updates).toHaveLength(1)
    expect(violation.updates[0].type).toBe(ViolationUpdateType.SECTION)
    expect(violation.updates[0].actor).toBe(actor)
    expect(violation.updates[0].payload).toEqual({
      from: null,
      to: '234602012',
      fromTown: { code: 10, name: 'town-1' },
      toTown: { code: 10, name: 'town-1' },
    })
  })

  it('corrects an existing section and keeps the previous one in the log', () => {
    const violation = violationIn(sofia, section('234602012', sofia))
    violation.setSection(actor, section('244601001', sofia))

    expect(violation.section.id).toBe('244601001')
    expect(violation.updates[0].payload).toMatchObject({
      from: '234602012',
      to: '244601001',
    })
  })

  it('moves the town to the section town within the same municipality', () => {
    const village = town(2)
    const violation = violationIn(sofia)
    violation.setSection(actor, section('234600123', village))

    expect(violation.town).toBe(village)
  })

  it('does nothing when the section is unchanged', () => {
    const current = section('234602012', sofia)
    const violation = violationIn(sofia, current)
    violation.setSection(actor, section('234602012', sofia))

    expect(violation.updates).toHaveLength(0)
  })

  it('allows a section in another municipality and moves the town', () => {
    const otherTown = town(3, otherMunicipality)
    const violation = violationIn(sofia, section('234602012', sofia))
    violation.setSection(actor, section('010100001', otherTown))

    expect(violation.section.id).toBe('010100001')
    expect(violation.town).toBe(otherTown)
    expect(violation.updates[0].payload).toEqual({
      from: '234602012',
      to: '010100001',
      fromTown: { code: 10, name: 'town-1' },
      toTown: { code: 30, name: 'town-3' },
    })
  })

  it('allows moving a violation from a domestic town to a section abroad', () => {
    const abroad = town(4, null)
    const violation = violationIn(sofia)
    violation.setSection(actor, section('320100001', abroad))

    expect(violation.town).toBe(abroad)
  })

  it('refuses a missing section', () => {
    const violation = violationIn(sofia)
    expect(() => violation.setSection(actor, undefined)).toThrow(
      ViolationSectionException,
    )
  })
})
