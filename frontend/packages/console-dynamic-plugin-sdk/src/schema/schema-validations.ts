/* eslint-disable global-require, @typescript-eslint/no-require-imports */

import * as _ from 'lodash';
import { ConsolePackageJSON } from './plugin-package';
import { ConsoleExtensionsJSON } from './console-extensions';
import { ConsolePluginManifestJSON } from './plugin-manifest';
import { SchemaValidator } from '../validation/SchemaValidator';
import { extensionsFile, pluginManifestFile } from '../constants';

export const validatePackageFileSchema = (
  pkg: ConsolePackageJSON,
  description = 'package.json',
) => {
  const schema = require('../../schema/plugin-package').default;
  const validator = new SchemaValidator(description);

  if (pkg.consolePlugin) {
    validator.validate(schema, pkg.consolePlugin, 'pkg.consolePlugin');
    validator.assert.validDNSSubdomainName(pkg.consolePlugin.name, 'pkg.consolePlugin.name');
    validator.assert.validSemverString(pkg.consolePlugin.version, 'pkg.consolePlugin.version');

    if (_.isPlainObject(pkg.consolePlugin.dependencies)) {
      Object.entries(pkg.consolePlugin.dependencies).forEach(([depName, versionRange]) => {
        validator.assert.validSemverRangeString(
          versionRange,
          `pkg.consolePlugin.dependencies['${depName}']`,
        );
      });
    }
  } else {
    validator.result.addError('pkg.consolePlugin object is missing');
  }

  return validator.result;
};

export const validateExtensionsFileSchema = (
  extensions: ConsoleExtensionsJSON,
  description = extensionsFile,
) => {
  const schema = require('../../schema/console-extensions').default;
  return new SchemaValidator(description).validate(schema, extensions);
};

export const validatePluginManifestSchema = (
  manifest: ConsolePluginManifestJSON,
  description = pluginManifestFile,
) => {
  const schema = require('../../schema/plugin-manifest').default;
  const validator = new SchemaValidator(description);

  validator.validate(schema, manifest, 'manifest');
  validator.assert.validDNSSubdomainName(manifest.name, 'manifest.name');
  validator.assert.validSemverString(manifest.version, 'manifest.version');

  if (_.isPlainObject(manifest.dependencies)) {
    Object.entries(manifest.dependencies).forEach(([depName, versionRange]) => {
      validator.assert.validSemverRangeString(versionRange, `manifest.dependencies['${depName}']`);
    });
  }

  return validator.result;
};
