import * as _ from 'lodash';
import { coFetch } from '@console/internal/co-fetch';
import { pluginManifestFile } from '../constants';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { resolveURL } from '../utils/url';

export const validatePluginManifestSchema = async (
  manifest: ConsolePluginManifestJSON,
  manifestURL: string,
) => {
  const schema = (await import('../../schema/plugin-manifest')).default;

  // Use dynamic import to avoid pulling ajv dependency tree into main vendors chunk
  const SchemaValidator = await import(
    '@console/dynamic-plugin-sdk/src/validation/SchemaValidator'
  ).then((m) => m.SchemaValidator);

  const validator = new SchemaValidator(manifestURL);
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

export const fetchPluginManifest = async (baseURL: string) => {
  const url = resolveURL(baseURL, pluginManifestFile);
  // eslint-disable-next-line no-console
  console.info(`Loading plugin manifest from ${url}`);

  const response: Response = await coFetch(url, { method: 'GET' });
  const manifest = (await response.json()) as ConsolePluginManifestJSON;

  (await validatePluginManifestSchema(manifest, url)).report();
  return manifest;
};
