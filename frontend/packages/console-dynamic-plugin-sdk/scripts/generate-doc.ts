import * as fs from 'fs';
import * as path from 'path';
import * as tsdoc from '@microsoft/tsdoc';
import chalk from 'chalk';
import * as ejs from 'ejs';
import * as _ from 'lodash';
import * as tsu from 'tsutils';
import * as ts from 'typescript';
import { resolvePath, relativePath } from './utils/path';
import { ExtensionTypeInfo, getConsoleTypeResolver } from './utils/type-resolver';
import { getProgramFromFile, printJSDocComments } from './utils/typescript';

const EXAMPLE = '@example';
const DYNAMIC_PKG_PATH = '@console/dynamic-plugin-sdk/';
const GITHUB_URL = 'https://github.com/openshift/console/tree/release-4.12/frontend';

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
    // Sort extensions by their `type` value
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
  printComments: (docComments: string[]) => printJSDocComments(docComments).replace(/\n/g, '<br/>'),
  escapeTableCell: (value: string) => value.replace(/\|/g, '\\|'),
  safeHeaderLink: (value: string) => value.replace(/[./]/g, ''),
});

type ComponentInfo = {
  name: string;
  doc: any;
};

const renderDocNode = (docNode: tsdoc.DocNode): string => {
  let result: string = '';
  if (docNode) {
    // Todo (bipuladh): Improve support for links.
    if (docNode instanceof tsdoc.DocExcerpt) {
      result += docNode.content.toString();
    }
    for (const childNode of docNode.getChildNodes()) {
      result += renderDocNode(childNode);
    }
  }
  return result;
};

// Use typescript AST to traverse the VariableDeclaration initializer, find the first call to
// require(), and resolve the import. If no call to require is found, returns null.
const resolveRequire = (variableDeclaration: ts.VariableDeclaration) => {
  return variableDeclaration.initializer?.forEachChild((node) => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'require') {
      const [requireArgument] = node.arguments ?? [];
      if (ts.isStringLiteral(requireArgument)) {
        return require.resolve(requireArgument.text);
      }
    }
    return null; // ts.Node.forEachChild keeps traversing until a truthy value is returned
  });
};

const generateGitLinkDoc = (variableDeclaration: ts.VariableDeclaration) => {
  const resolvedRequire = resolveRequire(variableDeclaration);
  const absolutePath = resolvedRequire ?? variableDeclaration.getSourceFile().fileName;
  const urlPath = absolutePath.replace(/.*((packages|public)\/.*)/, '$1');
  const link = `${GITHUB_URL}/${urlPath}`;
  return {
    summary: `[For more details please refer the implementation](${link})`,
  };
};

const generateDoc = (comment: tsdoc.DocComment) => {
  const summary = renderDocNode(comment.summarySection);
  const exampleBlock = comment.customBlocks.find((block) => block?.blockTag?.tagName === EXAMPLE);
  const example = renderDocNode(exampleBlock?.content);
  const parameters = comment.params.blocks.map((param) => ({
    parameterName: param.parameterName,
    description: renderDocNode(param.content),
  }));
  const returns = renderDocNode(comment.returnsBlock?.content);
  const deprecated = renderDocNode(comment.deprecatedBlock);
  return {
    summary,
    example,
    parameters,
    returns,
    deprecated,
  };
};

const getDocPath = (relPath: string, absolutePath?: string): string => {
  // Uses '@console/dynamic-plugin-sdk' based imports
  if (!absolutePath) {
    const slicedPath = relPath.replace(DYNAMIC_PKG_PATH, '');
    return resolvePath(slicedPath);
  }
  const dirName = path.dirname(absolutePath);
  return require.resolve(path.resolve(dirName, relPath));
};

const sanitizePath = (uglyPath: string): string => uglyPath.replace(/'/g, '');

const parseFile = (
  tsdocParser: tsdoc.TSDocParser,
  fPath: string,
  exportedComponents: ComponentInfo[],
  exposedComponents?: string[],
) => {
  const program = getProgramFromFile(fPath);
  const sourceFile = program.getSourceFile(fPath);
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isExportDeclaration(node)) {
      const isAbsPath = node.moduleSpecifier.getText().includes(DYNAMIC_PKG_PATH);
      const filePath = getDocPath(
        sanitizePath(node.moduleSpecifier.getText()),
        isAbsPath ? undefined : fPath,
      );
      if (!node.exportClause) {
        parseFile(tsdocParser, filePath, exportedComponents, exposedComponents);
      }
      if (node.exportClause) {
        const componentsExposed = node.exportClause;
        const docRequired = (componentsExposed as ts.NamedExports).elements.map((element) => {
          // Ensures `x as y` returns only x.
          return element.getChildAt(0).getText();
        });
        parseFile(tsdocParser, require.resolve(filePath), exportedComponents, docRequired);
      }
    } else if (ts.isVariableStatement(node) && tsu.canHaveJsDoc(node)) {
      const [variableDeclaration] = node.declarationList.declarations;
      const name = variableDeclaration.name.getText();
      if ((exposedComponents && exposedComponents.includes(name)) || !exposedComponents) {
        const [comment] = _.compact(tsu.getJsDoc(node, sourceFile)) ?? [];
        if (comment) {
          const str = comment.getFullText();
          const parsedText = tsdocParser.parseString(str).docComment;
          exportedComponents.push({
            name,
            doc: generateDoc(parsedText),
          });
        } else {
          exportedComponents.push({
            name,
            doc: generateGitLinkDoc(variableDeclaration),
          });
        }
      }
    }
  });
  return exportedComponents;
};

const getAPIs = () => {
  const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser();
  console.log('Generating core API docs');
  const FILE = resolvePath('src/api/core-api.ts');
  const exportedComponents: ComponentInfo[] = [];
  parseFile(tsdocParser, FILE, exportedComponents);
  return exportedComponents;
};

renderTemplate('scripts/templates/api.md.ejs', {
  apis: getAPIs().sort((a, b) => {
    if (a.doc.deprecated !== b.doc.deprecated) {
      return a.doc.deprecated ? 1 : -1;
    }
    return 1;
  }),
  printComments: (docComments: string) => printJSDocComments([docComments]).replace(/\n/g, '<br/>'),
  removeNewLines: (comment: string) => comment.replace('\n', ''),
  toLowerCase: (str: string) => str.toLocaleLowerCase(),
});
