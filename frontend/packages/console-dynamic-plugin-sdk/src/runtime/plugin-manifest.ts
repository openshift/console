import { coFetch } from '@console/internal/co-fetch';
import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';
import { pluginManifestFile } from '../constants';
import pluginManifestSchema from '../../dist/schema/plugin-manifest';

export const fetchPluginManifest = async (baseURL: string) => {
  const url = new URL(pluginManifestFile, baseURL).toString();
  const response: Response = await coFetch(url, { method: 'GET' });
  const manifest = (await response.json()) as ConsolePluginManifestJSON;

  // Avoid pulling ajv dependency into main vendors chunk
  const SchemaValidator = await import(
    '@console/dynamic-plugin-sdk/src/validation/SchemaValidator'
  ).then((m) => m.SchemaValidator);

  new SchemaValidator(url).validate(pluginManifestSchema, manifest).report();
  return manifest;
};
