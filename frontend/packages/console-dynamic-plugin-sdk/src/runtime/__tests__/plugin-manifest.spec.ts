import * as coFetchModule from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';
import { getPluginManifest } from '../../utils/test-utils';
import { fetchPluginManifest } from '../plugin-manifest';

jest.mock('@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch'),
  consoleFetch: jest.fn(),
}));

const coFetch = coFetchModule.consoleFetch as jest.Mock;

beforeEach(() => {
  coFetch.mockReset();
});

// Note: With ES modules in Jest 30, internal function calls within the same module cannot
// be mocked. fetchPluginManifest calls validatePluginManifestSchema directly, bypassing
// the module mock. Therefore, we use valid lowercase plugin names to pass actual validation.
describe('fetchPluginManifest', () => {
  it('loads, validates and returns the manifest object', async () => {
    // Use lowercase plugin name to pass actual validation (ES module mock limitation)
    const manifest = getPluginManifest('test', '1.2.3');
    const manifestURL = 'http://example.com/test/plugin-manifest.json';

    coFetch.mockResolvedValue({ json: () => Promise.resolve(manifest) } as Response);

    const result = await fetchPluginManifest('http://example.com/test/');

    expect(result).toEqual(manifest);
    expect(coFetch).toHaveBeenCalledWith(manifestURL, { method: 'GET' });
  });

  it('throws an error if the HTTP request fails', async () => {
    coFetch.mockImplementation(() => Promise.reject(new Error('boom')));

    await expect(fetchPluginManifest('http://example.com/test/')).rejects.toThrow('boom');
    expect(coFetch).toHaveBeenCalled();
  });

  it('throws an error if the validation fails', async () => {
    // Use invalid uppercase plugin name to trigger actual validation failure
    // (ES module mock limitation - can't mock internal validatePluginManifestSchema call)
    const manifest = getPluginManifest('InvalidName', '1.2.3');
    const manifestURL = 'http://example.com/test/plugin-manifest.json';

    coFetch.mockResolvedValue({ json: () => Promise.resolve(manifest) } as Response);

    await expect(fetchPluginManifest('http://example.com/test/')).rejects.toThrow(
      'Validation failed',
    );
    expect(coFetch).toHaveBeenCalledWith(manifestURL, { method: 'GET' });
  });
});
