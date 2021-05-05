import { coFetch } from '@console/internal/co-fetch';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { validatePluginManifestSchema } from '../schema/schema-validations';
import { pluginManifestFile } from '../constants';
import { resolveURL } from '../utils/url';

export const fetchPluginManifest = async (baseURL: string) => {
  const url = resolveURL(baseURL, pluginManifestFile);

  // eslint-disable-next-line no-console
  console.info(`Loading plugin manifest from ${url}`);

  const response: Response = await coFetch(url, { method: 'GET' });
  const manifest = (await response.json()) as ConsolePluginManifestJSON;

  validatePluginManifestSchema(manifest, url).report();

  return manifest;
};
