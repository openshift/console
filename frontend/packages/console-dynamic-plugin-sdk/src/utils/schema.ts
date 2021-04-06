import * as path from 'path';
import * as fs from 'fs';

export const getSchemaPath = (fileName: string): string =>
  fs.existsSync(path.join(__dirname, `../../dist/schema/${fileName}.js`))
    ? `../../dist/schema/${fileName}`
    : `../../schema/${fileName}`;
