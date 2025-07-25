import * as fs from 'fs';
import * as path from 'path';
import * as tsdoc from '@microsoft/tsdoc';
import * as tsdocConfig from '@microsoft/tsdoc-config';
import chalk from 'chalk';
import * as ejs from 'ejs';
import * as _ from 'lodash';
import * as ts from 'typescript';
import { parseJSONC } from '../src/utils/jsonc';
import { resolvePath, relativePath } from './utils/path';
import { ExtensionTypeInfo, getConsoleTypeResolver } from './utils/type-resolver';
import { getProgramFromFile, printJSDocComments } from './utils/typescript';

const printComments = (docComments: string[] | string) =>
  printJSDocComments(Array.isArray(docComments) ? docComments : [docComments]).replace(
    /\n/g,
    '<br/>',
  );

const getConsoleExtensions = () => {
  const program = getProgramFromFile(resolvePath('src/schema/console-extensions.ts'));
  return getConsoleTypeResolver(program).getConsoleExtensions(true).result;
};

const renderTemplate = (srcFile: string, data: {}) => {
  const content = ejs.render(fs.readFileSync(resolvePath(srcFile), 'utf-8'), data, {
    filename: srcFile,
    root: resolvePath('.'),
  });

  const outPath = resolvePath(`docs/${path.parse(srcFile).name}`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);

  console.log(chalk.green(relativePath(outPath)));
};

console.log('Generating Console plugin documentation');

renderTemplate('scripts/templates/console-extensions.md.ejs', {
  extensions: getConsoleExtensions()
    // Sort extensions by type, list non-deprecated extensions first
    .sort((a, b) => {
      if (a.isDeprecated !== b.isDeprecated) {
        return a.isDeprecated ? 1 : -1;
      }
      return a.type.localeCompare(b.type);
    })
    // Sort extension properties by their optional modifier
    .map<ExtensionTypeInfo>((e) => ({
      ...e,
      properties: e.properties.sort((a, b) =>
        a.optional === b.optional ? 0 : a.optional ? 1 : -1,
      ),
    })),
  printComments,
  escapeTableCell: (value: string) => value.replace(/\|/g, '\\|'),
  safeHeaderLink: (value: string) => value.replace(/[./]/g, ''),
});

const renderDocNode = (docNode?: tsdoc.DocNode): string => {
  let result = '';

  if (docNode) {
    // TODO(bipuladh): Improve support for links.
    if (docNode instanceof tsdoc.DocExcerpt) {
      result += docNode.content.toString();
    }

    for (const childNode of docNode.getChildNodes()) {
      result += renderDocNode(childNode);
    }
  }

  return result;
};

const getDocText = (docNode?: tsdoc.DocNode) => renderDocNode(docNode).trim();

const validConsolePluginAPITagValues = ['react-component', 'react-hook'] as const;
const validConsolePluginAPITypes = [...validConsolePluginAPITagValues, 'not-documented'] as const;

type PluginAPIType = typeof validConsolePluginAPITypes[number];

type PluginAPIInfo = {
  name: string;
  type: PluginAPIType;
  srcFilePath: string;
  isDeprecated: boolean;
  doc: {
    summary: string;
    example?: string;
    parameters?: { name: string; description: string }[];
    returns?: string;
    deprecated?: string;
  };
};

const getTSDocParser = () => {
  const configFile: tsdocConfig.TSDocConfigFile = tsdocConfig.TSDocConfigFile.loadForFolder(
    resolvePath('../..'),
  );

  if (configFile.hasErrors) {
    throw new Error(configFile.getErrorSummary());
  }

  const config = new tsdoc.TSDocConfiguration();
  configFile.configureParser(config);

  // Ignore warnings about TSDoc tags "not supported by this tool"
  config.validation.reportUnsupportedTags = false;

  return new tsdoc.TSDocParser(config);
};

const getConsolePluginAPIs = () => {
  const srcPath = resolvePath('src/api/core-api.ts');
  const program = getProgramFromFile(srcPath);
  const typeChecker = program.getTypeChecker();
  const tsDocParser = getTSDocParser();

  return typeChecker
    .getExportsOfModule(typeChecker.getSymbolAtLocation(program.getSourceFile(srcPath)))
    .reduce<PluginAPIInfo[]>((acc, symbol) => {
      const name = symbol.getName();
      let declaration = _.head(symbol.declarations);

      if (ts.isExportSpecifier(declaration)) {
        declaration = _.head(
          typeChecker.getExportSpecifierLocalTargetSymbol(declaration)?.declarations,
        );
      }

      const jsDocs = ts.getJSDocCommentsAndTags(declaration).filter(ts.isJSDoc);
      const pkgFilePath = relativePath(declaration.getSourceFile().fileName);
      const srcFilePath = `frontend/packages/console-dynamic-plugin-sdk/${pkgFilePath}`;

      if (jsDocs.length === 0) {
        acc.push({
          name,
          type: 'not-documented',
          srcFilePath,
          isDeprecated: false,
          doc: {
            summary: `Documentation is not available, please refer to the implementation.`,
          },
        });

        return acc;
      }

      // Console APIs should be documented using a single JSDoc comment block
      const jsDocText = jsDocs[0].getFullText();
      const { docComment } = tsDocParser.parseString(jsDocText);

      const consolePluginAPIBlock = docComment.customBlocks.find(
        (block) => block.blockTag.tagName === '@consolePluginAPI',
      );

      const declaredType = consolePluginAPIBlock
        ? getDocText(consolePluginAPIBlock.content)
        : 'not-documented';

      if (consolePluginAPIBlock && !validConsolePluginAPITagValues.includes(declaredType as any)) {
        throw new Error(
          `TSDoc tag @consolePluginAPI on symbol ${name} must be followed by one of: ${validConsolePluginAPITagValues.join(
            ', ',
          )}`,
        );
      }

      const doc = {
        summary: getDocText(docComment.summarySection),
        example: getDocText(
          docComment.customBlocks.find((block) => block.blockTag.tagName === '@example')?.content,
        ),
        parameters: docComment.params.blocks.map((param) => ({
          name: param.parameterName,
          description: getDocText(param.content),
        })),
        returns: getDocText(docComment.returnsBlock?.content),
        deprecated: getDocText(docComment.deprecatedBlock),
      };

      acc.push({
        name,
        type: declaredType as PluginAPIType,
        srcFilePath,
        isDeprecated: !!doc.deprecated,
        doc,
      });

      return acc;
    }, []);
};

console.log('Generating Console plugin API docs');

renderTemplate('scripts/templates/api.md.ejs', {
  apis: getConsolePluginAPIs()
    // Sort APIs by name, list non-deprecated APIs first
    .sort((a, b) => {
      if (a.isDeprecated !== b.isDeprecated) {
        return a.isDeprecated ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    }),
  apiTypes: validConsolePluginAPITypes,
  gitBranch: parseJSONC('console-meta.jsonc')['git-branch'],
  printComments,
  removeNewLines: (text: string) => text.replace('\n', ''),
});
