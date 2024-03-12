import * as ts from 'typescript';
import * as webpack from 'webpack';
import { DynamicModuleMap } from '../../utils/dynamic-module-parser';

export type DynamicModuleImportLoaderOptions = {
  dynamicModuleMaps: Record<string, DynamicModuleMap>;
  resourceMetadata: { jsx: boolean };
};

export type DynamicModuleImportLoader = webpack.LoaderDefinitionFunction<
  DynamicModuleImportLoaderOptions
>;

const getImportInfo = (importDeclaration: ts.ImportDeclaration) => {
  const moduleSpecifier = (importDeclaration.moduleSpecifier as ts.StringLiteral).text;
  const namedBindings = importDeclaration.importClause?.namedBindings;
  const importNameToAlias: Record<string, string> = {};

  if (namedBindings && ts.isNamedImports(namedBindings)) {
    namedBindings.forEachChild((node: ts.Node) => {
      if (ts.isImportSpecifier(node)) {
        importNameToAlias[node.propertyName?.text ?? node.name.text] = node.name.text;
      }
    });
  }

  return { moduleSpecifier, importNameToAlias };
};

/**
 * Internal webpack loader used to apply dynamic module import transformations.
 *
 * For example, the following import:
 * ```ts
 * import { Alert, AlertProps, Wizard } from '@patternfly/react-core';
 * ```
 * will be transformed into:
 * ```ts
 * import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
 * import { AlertProps } from '@patternfly/react-core/dist/dynamic/components/Alert';
 * import { Wizard } from '@patternfly/react-core/dist/dynamic/components/Wizard';
 * ```
 *
 * This loader requires the `typescript` package to be installed in the consuming project.
 *
 * @see https://webpack.js.org/contribute/writing-a-loader/
 */
const dynamicModuleImportLoader: DynamicModuleImportLoader = function (source) {
  const { dynamicModuleMaps, resourceMetadata } = this.getOptions();

  const sourceContainsDynamicModuleReference = Object.keys(dynamicModuleMaps).some(
    (m) => source.indexOf(m) !== -1,
  );

  if (!sourceContainsDynamicModuleReference) {
    return source;
  }

  const sourceFile = ts.createSourceFile(
    this.resourcePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    resourceMetadata.jsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  // TypeScript compiler sets the 'parseDiagnostics' property on created SourceFile instances,
  // but does not expose it via SourceFile type definition. To avoid additional processing overhead
  // (i.e. creating a fake CompilerHost and associated Program) in order to access this information
  // (i.e. getSyntacticDiagnostics API), we access the 'parseDiagnostics' property directly here.
  const parseDiagnostics: ts.Diagnostic[] = (sourceFile as any).parseDiagnostics ?? [];

  const hasParseErrors =
    parseDiagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error).length > 0;

  if (hasParseErrors) {
    this.getLogger().warn(`Detected parse errors in ${this.resourcePath}`);

    return source;
  }

  const sourceReplacements: Record<string, string> = {};

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const { moduleSpecifier, importNameToAlias } = getImportInfo(node);

      const dynamicModuleName = Object.keys(dynamicModuleMaps).find((m) =>
        moduleSpecifier.startsWith(m),
      );

      if (!dynamicModuleName) {
        return;
      }

      const isIndexImport = moduleSpecifier === dynamicModuleName;

      if (isIndexImport && Object.keys(importNameToAlias).length > 0) {
        const dynamicImportStatements: string[] = [];

        Object.entries(importNameToAlias).forEach(([name, alias]) => {
          const createImportStatement = (modulePath?: string) =>
            `import { ${name !== alias ? `${name} as ${alias}` : `${name}`} } from '${
              modulePath ? `${dynamicModuleName}/${modulePath}` : dynamicModuleName
            }';`;

          const dynamicModulePath = dynamicModuleMaps[dynamicModuleName][name];

          if (!dynamicModulePath) {
            this.getLogger().warn(`No dynamic module found for ${name} in ${dynamicModuleName}`);
          }

          dynamicImportStatements.push(createImportStatement(dynamicModulePath));
        });

        sourceReplacements[node.getText(sourceFile)] = dynamicImportStatements.join('\n');
      }

      if (
        !isIndexImport &&
        !Object.values(dynamicModuleMaps[dynamicModuleName]).find(
          (modulePath) => moduleSpecifier === `${dynamicModuleName}/${modulePath}`,
        )
      ) {
        this.getLogger().warn(`Non-index and non-dynamic module import ${moduleSpecifier}`);
      }
    }
  });

  return Object.entries(sourceReplacements).reduce(
    (acc, [search, replacement]) => acc.replace(search, replacement),
    sourceFile.getFullText(),
  );
};

export default dynamicModuleImportLoader;
