import { ELECTION_REGION_ABROAD } from './sections.constants'

/** The fields of a section that its street address is worked out from. */
export interface SectionAddressSource {
  id?: string | null
  place?: string | null
  address?: string | null
}

/**
 * The street address of a section: the `address` column when set, otherwise
 * the `place` of a domestic section (which has always held its address).
 * An abroad section's `place` is the name of its committee
 * („Посолство“, „Баркинг 2“), never an address, so it falls back to null.
 */
export function sectionAddress(section: SectionAddressSource): string | null {
  const address = (section.address ?? '').trim()
  if (address) {
    return address
  }
  const id = String(section.id ?? '').trim()
  if (id.startsWith(ELECTION_REGION_ABROAD)) {
    return null
  }
  const place = (section.place ?? '').trim()
  return place || null
}
