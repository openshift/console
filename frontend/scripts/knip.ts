import * as fs from 'fs';
import * as path from 'path';
import type { KnipConfig } from 'knip';
import { resolvePluginPackages } from '@console/plugin-sdk/src/codegen/plugin-resolver';
import { extensionsFile } from '@console/dynamic-plugin-sdk/src/constants';
import { isEncodedCodeRef } from '@openshift/dynamic-plugin-sdk';
import { parseJSONC } from '@console/dynamic-plugin-sdk/src/utils/jsonc';
import type { ConsoleExtensionsJSON } from '@console/dynamic-plugin-sdk/src/schema/console-extensions';
import { traverse, types as t, parseAsync } from '@babel/core';

const packagesDir = path.resolve(__dirname, '..', 'packages');

/** Generate an import statement for a specific export from a module path. */
const makeImport = (modulePath: string, exportName: string, id: number) =>
  `import { ${exportName} as _${id} } from '${modulePath}';`;

/** Plugin packages indexed by path, resolved once when knip loads the config */
const pluginPackagesByPath = new Map(resolvePluginPackages().map((pkg) => [pkg._path, pkg]));

/**
 * Parse the `EncodedCodeRef` value into `[moduleName, exportName]` tuple.
 *
 * Returns an empty array if the value doesn't match the expected format.
 */
const parseEncodedCodeRefValue = (value: string): [string, string] | [] => {
  const match = value.match(/^([^.]+)(?:\.(.+)){0,1}$/);
  return match ? [match[1], match[2] || 'default'] : [];
};

/**
 * JSON compiler for console-extensions.json files.
 *
 * Walks $codeRef values and generates static named imports so knip treats
 * the referenced exports as used. Static imports are used rather than
 * dynamic imports because knip cannot trace which specific export is
 * accessed through `import().then(m => m.X)`.
 */
const compileJSON = (_source: string, filename: string): string => {
  const pkg = pluginPackagesByPath.get(path.dirname(filename));
  if (!pkg) {
    return '';
  }

  const exposedModules = pkg.consolePlugin.exposedModules || {};
  const extensions = parseJSONC<ConsoleExtensionsJSON>(filename);
  const imports: string[] = [];
  let id = 0;

  // Walk the extensions tree using JSON.stringify replacer to find $codeRef
  // values, matching the approach used by getDynamicExtensions in local-plugins.ts.
  JSON.stringify(extensions, (_key, value) => {
    if (isEncodedCodeRef(value)) {
      const [moduleName, exportName] = parseEncodedCodeRefValue(value.$codeRef);
      if (moduleName && exposedModules[moduleName]) {
        imports.push(makeImport(`./${exposedModules[moduleName]}`, exportName, id++));
      }
    }
    return value;
  });

  return imports.join('\n');
};

/**
 * Auto-discovered package workspaces.
 *
 * Packages with src/index.ts use it as the entry; others use all src files.
 * Plugin packages include console-extensions.json as an entry so the
 * compiler above can process their $codeRef values.
 */
const packageWorkspaces = Object.fromEntries(
  fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter(
      (dir) =>
        dir.isDirectory() &&
        dir.name !== 'console-dynamic-plugin-sdk' && // special case
        fs.existsSync(path.join(packagesDir, dir.name, 'package.json')),
    )
    .map((dir) => {
      const pkgDir = path.join(packagesDir, dir.name);
      const hasExtensions = pluginPackagesByPath.has(pkgDir);

      return [
        `packages/${dir.name}`,
        {
          entry: hasExtensions ? [extensionsFile] : [],
          project: ['src/**/*.{ts,tsx,js,jsx}'],
        },
      ];
    }),
);

/** Collect all `param.X` property names from an AST subtree. */
const collectPropertyNames = (node: t.Node, param: string): string[] => {
  const names: string[] = [];
  const walk = (n: t.Node) => {
    if (
      t.isMemberExpression(n) &&
      t.isIdentifier(n.object, { name: param }) &&
      t.isIdentifier(n.property)
    ) {
      names.push(n.property.name);
      return;
    }
    for (const key of t.VISITOR_KEYS[n.type] ?? []) {
      const child = (n as any)[key];
      if (Array.isArray(child)) {
        child.forEach((c: t.Node) => t.isNode(c) && walk(c));
      } else if (t.isNode(child)) {
        walk(child);
      }
    }
  };
  walk(node);
  return names;
};

/**
 * Compiler for JS/TS files that rewrites opaque import patterns into
 * static named imports so knip can trace individual export usage.
 *
 * Knip cannot natively determine which export is accessed from:
 * - `import('./module').then(m => m.X)` — treats entire module as used
 * - `require('pkg/module').X` — not traced at all
 *
 * For each match, this compiler prepends `import { X } from './mod'`
 * which gives knip export-level precision and keeps the module in the
 * dependency graph so transitive imports are still traced.
 */
const compileScript = async (source: string, filename: string): Promise<string> => {
  const ast = await parseAsync(source, {
    filename,
    parserOpts: { plugins: ['typescript', 'jsx'] },
    ast: true,
    code: false,
  }).catch(() => 'failed');

  if (typeof ast === 'string') {
    return source;
  }

  const imports: string[] = [];
  const removals: [number, number][] = [];

  traverse(ast, {
    noScope: true,

    // require('path').X
    MemberExpression({ node }) {
      if (
        t.isCallExpression(node.object) &&
        t.isIdentifier(node.object.callee, { name: 'require' }) &&
        t.isStringLiteral(node.object.arguments[0]) &&
        t.isIdentifier(node.property)
      ) {
        imports.push(
          makeImport(node.object.arguments[0].value, node.property.name, imports.length),
        );
        removals.push([node.start!, node.end!]);
      }
    },

    // import('path').then(m => m.X)
    CallExpression({ node }) {
      if (
        !t.isMemberExpression(node.callee) ||
        !t.isIdentifier(node.callee.property, { name: 'then' }) ||
        !t.isCallExpression(node.callee.object) ||
        node.callee.object.callee.type !== 'Import' ||
        !t.isStringLiteral(node.callee.object.arguments[0])
      ) {
        return;
      }

      const cb = node.arguments[0];
      if (!t.isArrowFunctionExpression(cb) && !t.isFunctionExpression(cb)) {
        return;
      }
      if (!t.isIdentifier(cb.params[0])) {
        return;
      }

      const mod = node.callee.object.arguments[0].value;
      const names = collectPropertyNames(cb.body, cb.params[0].name);
      for (const name of names) {
        imports.push(makeImport(mod, name, imports.length));
      }
      if (names.length > 0) {
        removals.push([node.start!, node.end!]);
      }
    },
  });

  if (imports.length === 0) {
    return source;
  }

  // Remove matched patterns from source in reverse to preserve offsets
  let transformed = source;
  for (const [start, end] of removals.sort((a, b) => b[0] - a[0])) {
    transformed = `${transformed.slice(0, start)}null${transformed.slice(end)}`;
  }
  return `${imports.join('\n')}\n${transformed}`;
};

const config: KnipConfig = {
  compilers: {
    json: compileJSON,
  },
  asyncCompilers: {
    ts: compileScript,
    tsx: compileScript,
    js: compileScript,
    jsx: compileScript,
  },

  workspaces: {
    // Disable auto-detected plugins that don't work at the moment
    '.': { project: [], jest: false },

    // public/ is the @console/internal workspace (has its own package.json)
    public: {
      entry: ['load-test.sw.js'],
      project: ['**/*.{ts,tsx,js,jsx}'],
    },

    // Suppress SDK from knip checks as any code there could be used by a dynamic remote plugin
    'packages/console-dynamic-plugin-sdk': {
      entry: ['src/**/*.{ts,tsx}'],
      ignore: ['scripts/**/*.ts'],
    },

    ...packageWorkspaces,
  },

  // Not shipped in production so we don't mind being loosey-goosey
  ignoreWorkspaces: [
    'packages/eslint-plugin-console',
    'packages/integration-tests',
    'packages/*/integration-tests',
  ],

  ignoreDependencies: [
    '@console/.*', // cross-references via yarn workspaces
    'lodash', // remapped to lodash-es by NormalModuleReplacementPlugin
    '@patternfly/patternfly', // imported via SCSS, which knip cannot trace
  ],

  ignore: ['**/.eslintrc.js', '**/__{tests,mocks}__/**'],

  // Too many false positives
  exclude: ['binaries', 'devDependencies'],
};

export default config;
