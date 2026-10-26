import { DataSource } from 'typeorm'
import { sectionAddress } from '../section-address'

export interface AbroadSectionListItem {
  id: string
  code: string
  /** Committee name: the city, „Посолство“, „Баркинг 2“. */
  place: string
  /** Street address from the МВнР table, null until loaded. */
  address: string | null
  town: { id: number; name: string }
  country: { code: string; name: string }
}

/** Every abroad (32*) section with its town, country and address, ordered by id. */
export async function listAbroadSections(
  dataSource: DataSource,
): Promise<AbroadSectionListItem[]> {
  const rows: Array<{
    id: string
    code: string
    place: string
    address: string | null
    town_code: number
    town_name: string
    country_code: string
    country_name: string
  }> = await dataSource.query(
    `select trim(s.id) as id, trim(s.code) as code, s.place, s.address,
            t.code as town_code, t.name as town_name,
            c.code as country_code, c.name as country_name
       from sections s
       join towns t on t.id = s.town_id
       join countries c on c.id = t.country_id
      where s.id like '32%'
      order by s.id`,
  )
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    place: row.place,
    address: sectionAddress(row),
    town: { id: Number(row.town_code), name: row.town_name },
    country: { code: row.country_code, name: row.country_name },
  }))
}
