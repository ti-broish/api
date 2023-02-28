/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { parse } from 'csv-parse'
import { Readable } from 'stream'

type Row = { section: string; population: string }

export function parseSectionsPopulationCsv(
  stream: Readable,
): Promise<Map<string, number>> {
  return new Promise((resolve, reject) => {
    const sections = new Map<string, number>()
    const parser = parse({ columns: true, skip_empty_lines: true })
      .on('readable', () => {
        let section: Row
        while ((section = parser.read())) {
          const id = section.section
          const population = parseInt(section.population, 10)
          if (isNaN(population)) {
            reject(
              new Error(
                `Invalid population value: ${section.population} for section ${section.section}`,
              ),
            )
            return
          }
          sections.set(id, population)
        }
      })
      .on('error', (error: Error) => {
        reject(new Error(`Failed to parse CSV file: ${error.message}`))
      })
      .on('end', () => {
        resolve(sections)
      })
    stream.pipe(parser)
  })
}
