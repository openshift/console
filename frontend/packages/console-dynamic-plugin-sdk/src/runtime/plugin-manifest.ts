import * as _ from 'lodash';
import { coFetch } from '@console/internal/co-fetch';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { resolveURL } from '../utils/url';

export const validatePluginManifestSchema = async (
  manifest: ConsolePluginManifestJSON,
  manifestURL: string,
) => {
  // eslint-disable-next-line
  const schema = require('../../generated/schema/plugin-manifest.cjs').default;

  // Use dynamic import to avoid pulling ajv dependency tree into main vendors chunk
  const SchemaValidator = await import('../validation/SchemaValidator').then(
    (m) => m.SchemaValidator,
  );

  const validator = new SchemaValidator(manifestURL);
  validator.validate(schema, manifest, 'manifest');

  validator.result.assertions.validDNSSubdomainName(manifest.name, 'manifest.name');
  validator.result.assertions.validSemverString(manifest.version, 'manifest.version');

  if (_.isPlainObject(manifest.dependencies)) {
    Object.entries(manifest.dependencies).forEach(([depName, versionRange]) => {
      validator.result.assertions.validSemverRangeString(
        versionRange,
        `manifest.dependencies['${depName}']`,
      );
    });
  }

  return validator.result;
};

export const fetchPluginManifest = async (baseURL: string) => {
  const url = resolveURL(baseURL, 'plugin-manifest.json');
  // eslint-disable-next-line no-console
  console.info(`Loading plugin manifest from ${url}`);

  const response: Response = await coFetch(url, { method: 'GET' });
  const manifest = (await response.json()) as ConsolePluginManifestJSON;

  (await validatePluginManifestSchema(manifest, url)).report();

  return manifest;
};
