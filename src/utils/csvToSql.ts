import * as parse from 'csv-parse';
import * as transform from 'stream-transform';
import { createReadStream, PathLike } from 'fs';
import { Stream } from 'stream';

const escValue = (value: string): string => {
  const str = value.trim();
  if (str.length === 0) {
    return 'NULL';
  }

  return "'" + str.replace(/'/g, "''") + "'";
}

const escSymbol = (str: string): string => `"${str}"`;

const streamToString = (stream: Stream): Promise<string> => {
  const chunks = [];

  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(chunks.join('')));
  });
};

const insertTemplate = `INSERT INTO :table (:columns) values (:values);\n`;
const createRecordsToInsertsTransformer = (tableName: string) => {
  const insert = insertTemplate.replace(':table', escSymbol(tableName));
  return transform((record, callback) => {
    callback(null, insert
      .replace(':columns', Object.keys(record).map(escSymbol).join(', '))
      .replace(':values', Object.values(record).map(escValue).join(', ')));
  });
};

export function csvToSql(
  csvPath: PathLike,
  tableName: string,
  options: { delimiter?: string, escape?: string, columns?: boolean|string[] } = {}
): Promise<string> {
  const { delimiter = ',', escape = '"', columns = true } = options;
  const parseRowsToObjects = parse({ delimiter, escape, columns: columns });
  const transformRecordsToSqlInserts = createRecordsToInsertsTransformer(tableName);

  return streamToString(
    createReadStream(csvPath)
    .pipe(parseRowsToObjects)
    .pipe(transformRecordsToSqlInserts)
  );
}
