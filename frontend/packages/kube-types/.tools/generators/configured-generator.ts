import { FileType, generateTypes } from './generic-generator';
import { Config } from '../config';

const filterStartRegex = /^(import|export function|})/;

const fromToJSONRegex = /.*(FromJSON|ToJSON)/;

const thisFolderImportEndRegexOneLine = /from '\.\/?';$/;
const dateRegex = /(.*[^A-Za-z0-9])(Date)([^A-Za-z0-9].*)/;

const resolveMappings = (line, replaceMappingsRegex, replaceMapping) => {
  let result = line;
  const possibleMapping = replaceMappingsRegex && replaceMapping && replaceMappingsRegex.exec(line);
  if (possibleMapping && possibleMapping[1]) {
    possibleMapping.forEach((value, index) => {
      if (index !== 0) {
        result = result.replace(value, replaceMapping[value]);
      }
    });
  }
  return result;
};

const resolveDate = (line) => {
  const possibleDate = dateRegex.exec(line);
  if (possibleDate && possibleDate.length === 4) {
    return `${possibleDate[1]}string${possibleDate[3]}`;
  }
  return line;
};

const getImports = (line) => {
  const start = line.indexOf('{');
  const end = line.indexOf('}');

  return line
    .substring(start < 0 ? 0 : start + 1, end < 0 ? line.length : end)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s);
};

/**
 * - removes global functions (..FromJSON(), ..toJSON())
 * - removes all imports (e.g. runtime folder) except the ones from this folder
 * - reorganizes imports to prevent circular dependencies
 */

export const processFile = (
  { content, filename }: FileType,
  { replaceMapping, dateAsString }: Config,
) => {
  const replaceMappingsRegex =
    replaceMapping && RegExp(`(${Object.keys(replaceMapping).join('|')})`);

  let isInsideGlobalFunction = false;
  let isInsideImport = false;

  let firstImportLineNumber = null;

  const filesToImport = [];
  const filesToImportBuffer = [];

  const resultContent = content
    .split('\n')
    .map((line, index) => {
      const possibleIlegalStart = filterStartRegex.exec(line);
      switch (possibleIlegalStart && possibleIlegalStart[1]) {
        case 'import':
          if (firstImportLineNumber == null) {
            firstImportLineNumber = index;
          }

          if (line.endsWith(';')) {
            if (line.match(thisFolderImportEndRegexOneLine)) {
              filesToImport.push(...getImports(line));
            }
            return null;
          }
          isInsideImport = true;
          return null;
        case 'export function':
          isInsideGlobalFunction = true;
          return null;
        case '}':
          if (isInsideGlobalFunction) {
            isInsideGlobalFunction = false;
            return null;
          }
          if (isInsideImport) {
            if (line.match(thisFolderImportEndRegexOneLine)) {
              filesToImport.push(...filesToImportBuffer);
            }
            filesToImportBuffer.length = 0;
            isInsideImport = false;
            return null;
          }
          break;
        default:
          break;
      }

      if (isInsideGlobalFunction) {
        return null;
      }

      if (isInsideImport) {
        filesToImportBuffer.push(...getImports(line));
        return null;
      }

      const result = resolveMappings(line, replaceMappingsRegex, replaceMapping);

      return dateAsString ? resolveDate(result) : result;
    })
    .filter((line) => line != null);

  const resolvedImports = filesToImport
    .filter((imp) => !fromToJSONRegex.exec(imp))
    .map((imp) => {
      const mappedImport = resolveMappings(imp, replaceMappingsRegex, replaceMapping);
      return `import { ${mappedImport} } from './${mappedImport}';`;
    });

  resultContent.splice(firstImportLineNumber, 0, ...resolvedImports);

  return {
    content: resultContent.join('\n'),
    filename: resolveMappings(filename, replaceMappingsRegex, replaceMapping),
  };
};

export const processAPIObject = (APIObj) => {
  // to prevent error: "Multiple schemas found in content, returning only the first one"
  APIObj.paths = {};
  return APIObj;
};

export const generateAndMapTypes = async (config: Config) =>
  generateTypes({
    config,
    processAPIObject,
    processFile: (file) => processFile(file, config),
  });
