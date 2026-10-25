import { User } from '../../users/entities'
import { Violation, ViolationStatus } from './violation.entity'
import { ViolationUpdateType } from './violation-update.entity'
import { ViolationStatusException } from './violation.exceptions'

describe('Violation status transitions', () => {
  const actor = Object.assign(new User(), { id: 'actor-id' })

  const violationWithStatus = (status: ViolationStatus): Violation => {
    const violation = new Violation()
    violation.status = status
    violation.isPublished = false
    violation.updates = []
    return violation
  }

  const lastUpdateType = (violation: Violation) =>
    violation.updates[violation.updates.length - 1].type

  it('processes a violation that is being processed', () => {
    const violation = violationWithStatus(ViolationStatus.PROCESSING)
    violation.process(actor)
    expect(violation.status).toBe(ViolationStatus.PROCESSED)
    expect(lastUpdateType(violation)).toBe(ViolationUpdateType.PROCESS)
  })

  it('rejects a violation that is being processed', () => {
    const violation = violationWithStatus(ViolationStatus.PROCESSING)
    violation.reject(actor)
    expect(violation.status).toBe(ViolationStatus.REJECTED)
    expect(lastUpdateType(violation)).toBe(ViolationUpdateType.REJECT)
  })

  it('allows processing a violation that was rejected by mistake', () => {
    const violation = violationWithStatus(ViolationStatus.REJECTED)
    violation.process(actor)
    expect(violation.status).toBe(ViolationStatus.PROCESSED)
    expect(violation.updates).toHaveLength(1)
    expect(lastUpdateType(violation)).toBe(ViolationUpdateType.PROCESS)
    expect(violation.updates[0].actor).toBe(actor)
  })

  it('allows rejecting a violation that was processed by mistake', () => {
    const violation = violationWithStatus(ViolationStatus.PROCESSED)
    violation.reject(actor)
    expect(violation.status).toBe(ViolationStatus.REJECTED)
    expect(violation.updates).toHaveLength(1)
    expect(lastUpdateType(violation)).toBe(ViolationUpdateType.REJECT)
  })

  it('unpublishes a published violation when it is rejected after processing', () => {
    const violation = violationWithStatus(ViolationStatus.PROCESSED)
    violation.isPublished = true
    violation.reject(actor)
    expect(violation.isPublished).toBe(false)
    expect(violation.updates.map((u) => u.type)).toEqual([
      ViolationUpdateType.UNPUBLISH,
      ViolationUpdateType.REJECT,
    ])
  })

  it.each([
    [ViolationStatus.RECEIVED, 'process'],
    [ViolationStatus.PROCESSED, 'process'],
    [ViolationStatus.RECEIVED, 'reject'],
    [ViolationStatus.REJECTED, 'reject'],
  ])('refuses to change status from %s via %s', (status, action) => {
    const violation = violationWithStatus(status)
    expect(() => violation[action](actor)).toThrow(ViolationStatusException)
    expect(violation.status).toBe(status)
    expect(violation.updates).toHaveLength(0)
  })
})
