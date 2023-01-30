import { parse } from 'csv-parse';
import { transform } from 'stream-transform';
import { createReadStream, PathLike } from 'fs';
import { Stream } from 'stream';

const escValue = (value: string): string => {
  if (value === 'NULL') {
    return value;
  }

  return "'" + value.replace(/'/g, "''") + "'";
};

const escSymbol = (str: string): string => `"${str}"`;

const defaultEmptyColumnCallback = (): string => 'NULL';

const streamToString = (stream: Stream): Promise<string> => {
  const chunks = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(chunks.join('')));
  });
};

const insertTemplate = `INSERT INTO :table (:columns) values (:values);\n`;
const createRecordsToInsertsTransformer = (
  tableName: string,
  emptyColumnCallback?: EmptyColumnDefaultValueFunction,
) => {
  const insert = insertTemplate.replace(':table', escSymbol(tableName));
  return transform((record, callback) => {
    callback(
      null,
      insert
        .replace(':columns', Object.keys(record).map(escSymbol).join(', '))
        .replace(
          ':values',
          Object.entries(record)
            .map(([key, value]) => {
              const str = ('' + value).trim();

              return escValue(str.length > 0 ? str : emptyColumnCallback(key));
            })
            .join(', '),
        ),
    );
  });
};

export type EmptyColumnDefaultValueFunction = {
  (column: string): string;
};

export function csvToSql(
  csvPath: PathLike,
  tableName: string,
  options: {
    delimiter?: string;
    escape?: string;
    columns?: boolean | string[];
    emptyColumnCallback?: EmptyColumnDefaultValueFunction;
  } = {},
): Promise<string> {
  const {
    delimiter = ',',
    escape = '"',
    columns = true,
    emptyColumnCallback = defaultEmptyColumnCallback,
  } = options;
  const parseRowsToObjects = parse({ delimiter, escape, columns });
  const transformRecordsToSqlInserts = createRecordsToInsertsTransformer(
    tableName,
    emptyColumnCallback,
  );

  return streamToString(
    createReadStream(csvPath)
      .pipe(parseRowsToObjects)
      .pipe(transformRecordsToSqlInserts),
  );
}
