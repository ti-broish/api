import * as jsonlines from 'jsonlines'
import * as fs from 'fs'
import { ulid } from 'ulid'

const inputFile = process.argv[2]
const actor_id = process.argv[3]
const origin = process.argv[4]
const parser = jsonlines.parse()
const stream = fs.createReadStream(inputFile)

const escSymbol = (str: string): string => `"${str}"`
const escValue = (value: string | number): string => {
  if (value === 'NULL') {
    return value
  }

  if (typeof value === 'number') {
    value = value.toString()
  }

  value = value.replace(/'/g, "''")

  return `'${value}'`
}

const insertTemplate = `INSERT INTO :table (:columns) values (:values);`
const inserterFactory = (tableName: string) => {
  const insert = insertTemplate.replace(':table', escSymbol(tableName))

  return (record: Record<string, string | number>): string => {
    return insert
      .replace(':columns', Object.keys(record).map(escSymbol).join(', '))
      .replace(
        ':values',
        Object.entries(record)
          .map(([, value]) => escValue(value))
          .join(', '),
      )
  }
}

const protocolInsert = inserterFactory('protocols')
// TODO: update this to use the new protocol.metadata jsonb column
const protocolDataInsert = inserterFactory('protocol_data')
const protocolActionInsert = inserterFactory('protocol_actions')
const protocolResultsInsert = inserterFactory('protocol_results')

parser.on(
  'data',
  ({
    section: section_id,
    results,
  }: {
    section: string
    results: number[]
  }) => {
    const protocol_id = ulid()
    console.log(
      protocolInsert({
        id: protocol_id,
        origin,
        section_id,
        status: 'approved',
      }),
    )
    console.log(
      protocolDataInsert({
        id: ulid(),
        protocol_id,
        valid_votes_count: results.reduce(
          (sum: number, result: number) => sum + result,
          0,
        ),
      }),
    )
    console.log(
      protocolActionInsert({
        id: ulid(),
        protocol_id,
        actor_id,
        action: 'send',
      }),
    )
    Object.entries(results).forEach(([party_id, valid_votes_count]) => {
      console.log(
        protocolResultsInsert({
          id: ulid(),
          protocol_id,
          party_id,
          valid_votes_count,
        }),
      )
    })
  },
)

stream.pipe(parser)
