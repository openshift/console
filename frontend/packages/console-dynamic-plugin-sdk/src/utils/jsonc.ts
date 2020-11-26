import * as fs from 'fs';
import * as jsonc from 'comment-json';

/**
 * Parse the given file as JSON with comments (JSONC).
 */
export const parseJSONC = <T = any>(filePath: string, removeComments = true) => {
  return jsonc.parse(fs.readFileSync(filePath, 'utf-8'), null, removeComments) as T;
};
