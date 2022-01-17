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

const getConsoleExtensions = () => {
  const program = getProgramFromFile(resolvePath('src/schema/console-extensions.ts'));
  return getConsoleTypeResolver(program).getConsoleExtensions(true).result;
};

const renderTemplate = (srcFile: string, data: {}) => {
  const content = ejs.render(fs.readFileSync(resolvePath(srcFile), 'utf-8'), data, {
    filename: srcFile,
    root: resolvePath('.'),
  });

  const outPath = resolvePath(`generated/doc/${path.parse(srcFile).name}`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);

  console.log(chalk.green(relativePath(outPath)));
};

console.log('Generating Console plugin documentation');

renderTemplate('scripts/templates/console-extensions.md.ejs', {
  extensions: getConsoleExtensions()
    // Sort extensions by their `type` value
    .sort((a, b) => a.type.localeCompare(b.type))
    // Sort extension properties by their optional modifier
    .map<ExtensionTypeInfo>((e) => ({
      ...e,
      properties: e.properties.sort((a, b) =>
        a.optional === b.optional ? 0 : a.optional ? 1 : -1,
      ),
    })),
  printComments: (docComments: string[]) => printJSDocComments(docComments).replace(/\n/g, '<br/>'),
  escapeTableCell: (value: string) => value.replace(/\|/g, '\\|'),
});

type ComponentInfo = {
  name: string;
  doc: any;
};

const EXAMPLE = '@example';
const DYNAMIC_PKG_PATH = '@console/dynamic-plugin-sdk/';

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

const generateGitLinkDoc = (filePath: string) => ({
  summary: `[For more details please refer the implementation](${filePath})`,
});

const generateDoc = (comment: tsdoc.DocComment) => {
  const summary = renderDocNode(comment.summarySection);
  const exampleBlock = comment.customBlocks.find((block) => block?.blockTag?.tagName === EXAMPLE);
  const example = renderDocNode(exampleBlock?.content);
  const parameters = comment.params.blocks.map((param) => {
    let { parameterName } = param;
    let description = renderDocNode(param.content);
    if (!parameterName) {
      parameterName = description.substring(1, description.indexOf('-') - 1);
      description = description.substring(description.indexOf('-') + 1);
    }
    return {
      parameterName,
      description,
    };
  });
  const returns = renderDocNode(comment.returnsBlock?.content);
  return {
    summary,
    example,
    parameters,
    returns,
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

const consoleLinkGenerator = (fileLocation: string, isRequire: boolean) => {
  const WORKSPACE = '@';
  const ABSOLUTE = '/frontend/';
  const INTERNAL_PKG = '@console/internal';
  const WEB_ROOT_LINK = 'https://github.com/openshift/console/tree/master/frontend';
  const location = isRequire
    ? fileLocation.substring(fileLocation.indexOf("'"), fileLocation.lastIndexOf("'"))
    : fileLocation;
  const isWorkspaceScoped = fileLocation.includes(WORKSPACE);
  if (isWorkspaceScoped) {
    const rootPath = `${__dirname.split('/packages')[0]}`;
    if (location.includes(INTERNAL_PKG)) {
      // Internal Paths are resolved a bit differently
      const INTERNAL_PATH = `${WEB_ROOT_LINK}/public`;
      const webPath = location.substring(INTERNAL_PKG.length + 2);
      const approxFilePath = `${rootPath}/public/${webPath}`;
      const exactPath = require.resolve(approxFilePath);
      const webLink = `${INTERNAL_PATH}/${webPath}.${exactPath.split('.')[1]}`;
      return webLink;
    }
    const PKG_PATH = `/packages`;
    // only console packages are exposed as part of the SDK
    const webPath = `${PKG_PATH}/console-${location.substring(PKG_PATH.length + 1)}`;
    const approxFilePath = `${rootPath}${webPath}`;
    const exactPath = require.resolve(approxFilePath);
    const webLink = `${WEB_ROOT_LINK}${webPath}.${exactPath.split('.')[1]}`;
    return webLink;
  }
  const subPath = location.split(ABSOLUTE)[1];
  const webLink = `${WEB_ROOT_LINK}/${subPath}`;
  return webLink;
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
      const name = node.declarationList.declarations[0].name.getText();
      if ((exposedComponents && exposedComponents.includes(name)) || !exposedComponents) {
        const comment = _.compact(tsu.getJsDoc(node, sourceFile));
        if (!_.isEmpty(comment)) {
          const filtered = _.head(comment);
          const str = filtered.getFullText();
          const parsedText = tsdocParser.parseString(str).docComment;
          // This particular one contains the comment
          const component = {
            name,
            doc: generateDoc(parsedText),
          };
          exportedComponents.push(component);
        } else {
          const variableDeclaration = node.declarationList.declarations[0];
          const lastChildIndex = variableDeclaration.getChildCount() - 1;
          const filePath = variableDeclaration.getChildAt(lastChildIndex).getFullText();
          // Check if it contains require
          const REQUIRE_REGEX = /require\(.*\);?/g;
          const udpatedFilePath = filePath.replace(/\n| */g, '');
          const isRequireStatement = REQUIRE_REGEX.test(udpatedFilePath);
          const component: ComponentInfo = {
            name,
            doc: null,
          };
          let link = null;
          if (isRequireStatement) {
            link = consoleLinkGenerator(udpatedFilePath, isRequireStatement);
          } else {
            const codeLocation = variableDeclaration.getSourceFile().fileName;
            link = consoleLinkGenerator(codeLocation, isRequireStatement);
          }
          component.doc = generateGitLinkDoc(link);
          exportedComponents.push(component);
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
  apis: getAPIs(),
  printComments: (docComments: string) => printJSDocComments([docComments]).replace(/\n/g, '<br/>'),
  removeNewLines: (comment: string) => comment.replace('\n', ''),
  toLowerCase: (str: string) => str.toLocaleLowerCase(),
});
