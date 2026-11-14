import type { PluginStore } from '@openshift/dynamic-plugin-sdk';
import { ErrorWithCause } from '../../utils/error/custom-error';
import { HttpError, TimeoutError } from '../../utils/error/http-error';
import {
  isRetryablePluginManifestError,
  loadAndEnablePlugin,
  PLUGIN_MANIFEST_MAX_ATTEMPTS,
} from '../plugin-init';

type PluginStoreMock = {
  loadPlugin: jest.Mock;
  getPluginInfo: jest.Mock;
  disablePlugins: jest.Mock;
};

const createPluginStoreMock = (): PluginStoreMock => ({
  loadPlugin: jest.fn().mockResolvedValue(undefined),
  getPluginInfo: jest.fn().mockReturnValue([]),
  disablePlugins: jest.fn(),
});

const asPluginStore = (store: PluginStoreMock) => store as unknown as PluginStore;

const loadedPluginInfo = (
  name: string,
  options: { disableStaticPlugins?: string[]; registrationMethod?: string } = {},
) => ({
  status: 'loaded' as const,
  manifest: {
    name,
    registrationMethod: options.registrationMethod ?? 'callback',
    customProperties: {
      console: {
        disableStaticPlugins: options.disableStaticPlugins ?? [],
      },
    },
  },
});

const failedPluginInfo = (name: string, errorMessage: string, errorCause?: unknown) => ({
  status: 'failed' as const,
  manifest: { name, registrationMethod: 'callback' },
  errorMessage,
  errorCause,
});

const wrapManifestError = (cause: unknown) =>
  new ErrorWithCause('Failed to load plugin manifest', cause);

describe('isRetryablePluginManifestError', () => {
  it.each([
    ['401', new HttpError('Unauthorized', 401)],
    ['408', new HttpError('Request Timeout', 408)],
    ['429', new HttpError('Too Many Requests', 429)],
    ['500', new HttpError('Internal Server Error', 500)],
    ['502', new HttpError('Bad Gateway', 502)],
    ['503', new HttpError('Service Unavailable', 503)],
    ['504', new HttpError('Gateway Timeout', 504)],
    ['TimeoutError', new TimeoutError('/api/plugins/test/plugin-manifest.json', 60000)],
    ['TypeError', new TypeError('Failed to fetch')],
  ])('returns true for %s', (_label, err) => {
    expect(isRetryablePluginManifestError(err)).toBe(true);
  });

  it('returns true when a retryable error is wrapped as ErrorWithCause', () => {
    expect(
      isRetryablePluginManifestError(wrapManifestError(new HttpError('Unauthorized', 401))),
    ).toBe(true);
  });

  it.each([
    ['400', new HttpError('Bad Request', 400)],
    ['403', new HttpError('Forbidden', 403)],
    ['404', new HttpError('Not Found', 404)],
    ['generic Error', new Error('invalid plugin manifest')],
  ])('returns false for %s', (_label, err) => {
    expect(isRetryablePluginManifestError(err)).toBe(false);
  });
});

describe('loadAndEnablePlugin', () => {
  const originalServerFlags = window.SERVER_FLAGS;
  let store: PluginStoreMock;
  let onError: jest.Mock;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    store = createPluginStoreMock();
    onError = jest.fn();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    window.SERVER_FLAGS = { ...originalServerFlags, basePath: '/test/' };
  });

  afterEach(() => {
    window.SERVER_FLAGS = originalServerFlags;
    warnSpy.mockRestore();
  });

  it('loads the plugin manifest from {basePath}api/plugins/{pluginName}/plugin-manifest.json', async () => {
    store.getPluginInfo.mockReturnValue([loadedPluginInfo('monitoring-plugin')]);

    await loadAndEnablePlugin('monitoring-plugin', asPluginStore(store), onError);

    expect(store.loadPlugin).toHaveBeenCalledTimes(1);
    expect(store.loadPlugin).toHaveBeenCalledWith(
      'http://localhost/test/api/plugins/monitoring-plugin/plugin-manifest.json',
    );
    expect(onError).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('retries a 401 manifest fetch and succeeds on a later attempt', async () => {
    store.loadPlugin
      .mockRejectedValueOnce(wrapManifestError(new HttpError('Unauthorized', 401)))
      .mockResolvedValueOnce(undefined);
    store.getPluginInfo.mockReturnValue([loadedPluginInfo('monitoring-plugin')]);

    await loadAndEnablePlugin('monitoring-plugin', asPluginStore(store), onError);

    expect(store.loadPlugin).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain(
      '[loadAndEnablePlugin] monitoring-plugin manifest fetch failed (attempt 1/3), retrying',
    );
  });

  it('retries a blocked/network fetch (TypeError) and succeeds on a later attempt', async () => {
    store.loadPlugin
      .mockRejectedValueOnce(wrapManifestError(new TypeError('Failed to fetch')))
      .mockResolvedValueOnce(undefined);
    store.getPluginInfo.mockReturnValue([loadedPluginInfo('monitoring-plugin')]);

    await loadAndEnablePlugin('monitoring-plugin', asPluginStore(store), onError);

    expect(store.loadPlugin).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });

  it('gives up after PLUGIN_MANIFEST_MAX_ATTEMPTS 401 failures', async () => {
    const unauthorized = wrapManifestError(new HttpError('Unauthorized', 401));
    store.loadPlugin.mockRejectedValue(unauthorized);

    await loadAndEnablePlugin('monitoring-plugin', asPluginStore(store), onError);

    expect(store.loadPlugin).toHaveBeenCalledTimes(PLUGIN_MANIFEST_MAX_ATTEMPTS);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      '[loadAndEnablePlugin] monitoring-plugin loadPlugin failed: Failed to load plugin manifest',
      unauthorized.cause,
    );
    expect(warnSpy).toHaveBeenCalledTimes(PLUGIN_MANIFEST_MAX_ATTEMPTS - 1);
  });

  it('does not retry a non-transient manifest error', async () => {
    const notFound = wrapManifestError(new HttpError('Not Found', 404));
    store.loadPlugin.mockRejectedValue(notFound);

    await loadAndEnablePlugin('monitoring-plugin', asPluginStore(store), onError);

    expect(store.loadPlugin).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      '[loadAndEnablePlugin] monitoring-plugin loadPlugin failed: Failed to load plugin manifest',
      notFound.cause,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('reports a plugin that loaded into failed status without retrying', async () => {
    const scriptError = new Error('script error');
    store.getPluginInfo.mockReturnValue([
      failedPluginInfo('monitoring-plugin', 'Failed to load scripts', scriptError),
    ]);

    await loadAndEnablePlugin('monitoring-plugin', asPluginStore(store), onError);

    expect(store.loadPlugin).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      '[loadAndEnablePlugin] monitoring-plugin loading failed: Failed to load scripts',
      scriptError,
    );
  });

  it('disables listed static plugins when the dynamic plugin loads', async () => {
    store.getPluginInfo.mockImplementation(() => [
      loadedPluginInfo('monitoring-plugin', { disableStaticPlugins: ['console-app'] }),
      loadedPluginInfo('console-app', { registrationMethod: 'local' }),
    ]);

    await loadAndEnablePlugin('monitoring-plugin', asPluginStore(store), onError);

    expect(store.disablePlugins).toHaveBeenCalledWith(
      ['console-app'],
      'disableStaticPlugins in monitoring-plugin',
    );
    expect(onError).not.toHaveBeenCalled();
  });

  it('does not let a dynamic plugin disable another dynamic plugin', async () => {
    store.getPluginInfo.mockImplementation(() => [
      loadedPluginInfo('monitoring-plugin', { disableStaticPlugins: ['other-dynamic'] }),
      loadedPluginInfo('other-dynamic', { registrationMethod: 'callback' }),
    ]);

    await loadAndEnablePlugin('monitoring-plugin', asPluginStore(store), onError);

    expect(store.disablePlugins).not.toHaveBeenCalled();
  });
});
