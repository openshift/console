import * as coFetchModule from '@console/internal/co-fetch';
import * as pluginManifestModule from '../plugin-manifest';
import * as schemaValidationsModule from '../../schema/schema-validations';
import { SchemaValidator } from '../../validation/SchemaValidator';
import { getPluginManifest } from '../../utils/test-utils';

const coFetch = jest.spyOn(coFetchModule, 'coFetch');

const validatePluginManifestSchema = jest.spyOn(
  schemaValidationsModule,
  'validatePluginManifestSchema',
);

const { fetchPluginManifest } = pluginManifestModule;

beforeEach(() => {
  [coFetch, validatePluginManifestSchema].forEach((mock) => mock.mockReset());
});

describe('fetchPluginManifest', () => {
  it('loads, validates and returns the manifest object', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const manifestURL = 'http://example.com/test/plugin-manifest.json';

    const validator = new SchemaValidator(manifestURL);
    const validatorResultReport = jest.spyOn(validator.result, 'report');

    coFetch.mockImplementation(() => Promise.resolve({ json: () => Promise.resolve(manifest) }));
    validatePluginManifestSchema.mockImplementation(() => validator.result);

    const result = await fetchPluginManifest('http://example.com/test/');

    expect(result).toBe(manifest);
    expect(coFetch).toHaveBeenCalledWith(manifestURL, { method: 'GET' });
    expect(validatePluginManifestSchema).toHaveBeenCalledWith(manifest, manifestURL);
    expect(validatorResultReport).toHaveBeenCalledWith();
  });

  it('throws an error if the HTTP request fails', async () => {
    coFetch.mockImplementation(() => Promise.reject(new Error('boom')));

    expect.assertions(2);
    try {
      await fetchPluginManifest('http://example.com/test/');
    } catch (e) {
      expect(coFetch).toHaveBeenCalled();
      expect(validatePluginManifestSchema).not.toHaveBeenCalled();
    }
  });

  it('throws an error if the validation fails', async () => {
    const manifest = getPluginManifest('Test', '1.2.3');
    const manifestURL = 'http://example.com/test/plugin-manifest.json';

    const validator = new SchemaValidator(manifestURL);
    jest.spyOn(validator.result, 'report').mockImplementation(() => {
      throw new Error('boom');
    });

    coFetch.mockImplementation(() => Promise.resolve({ json: () => Promise.resolve(manifest) }));
    validatePluginManifestSchema.mockImplementation(() => validator.result);

    expect.assertions(2);
    try {
      await fetchPluginManifest('http://example.com/test/');
    } catch (e) {
      expect(coFetch).toHaveBeenCalled();
      expect(validatePluginManifestSchema).toHaveBeenCalled();
    }
  });
});
