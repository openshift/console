import * as _ from 'lodash';
import { coFetch } from '@console/internal/co-fetch';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { pluginManifestFile } from '../constants';
import pluginManifestSchema from '../../dist/schema/plugin-manifest';
import { resolveURL } from '../utils/url';

export const validatePluginManifest = async (
  manifest: ConsolePluginManifestJSON,
  manifestURL: string,
) => {
  // Use dynamic import to avoid pulling ajv dependency tree into main vendors chunk
  const SchemaValidator = await import(
    '@console/dynamic-plugin-sdk/src/validation/SchemaValidator'
  ).then((m) => m.SchemaValidator);

  const validator = new SchemaValidator(manifestURL);
  validator.validate(pluginManifestSchema, manifest, 'manifest');

  validator.assert.nonEmptyString(manifest.name, 'manifest.name');
  validator.assert.nonEmptyString(manifest.version, 'manifest.version');

  if (_.isPlainObject(manifest.dependencies)) {
    Object.entries(manifest.dependencies).forEach(([depName, versionRange]) => {
      validator.assert.validSemverRangeString(versionRange, `manifest.dependencies['${depName}']`);
    });
  }

  return validator.result;
};

export const fetchPluginManifest = async (baseURL: string) => {
  const url = resolveURL(baseURL, pluginManifestFile, { trailingSlashInBaseURL: true });
  const response: Response = await coFetch(url, { method: 'GET' });
  const manifest = (await response.json()) as ConsolePluginManifestJSON;
  (await validatePluginManifest(manifest, url)).report();
  return manifest;
};
