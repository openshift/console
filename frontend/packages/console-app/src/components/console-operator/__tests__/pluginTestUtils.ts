import type {
  PluginCustomProperties,
  PluginLoaderInterface,
  RemotePluginManifest,
} from '@openshift/dynamic-plugin-sdk';
import { TestPluginStore } from '@openshift/dynamic-plugin-sdk';

const noopPluginLoader: PluginLoaderInterface = {
  loadPluginManifest: async (manifestURL: string) => {
    throw new Error(`Unexpected loadPluginManifest: ${manifestURL}`);
  },
  transformPluginManifest: (manifest) => manifest,
  loadPlugin: async () => ({
    success: true as const,
    loadedExtensions: [],
  }),
};

type PluginManifestOptions = {
  version?: string;
  customProperties?: PluginCustomProperties;
};

export const createRemotePluginManifest = (
  name: string,
  options: PluginManifestOptions = {},
): RemotePluginManifest => ({
  name,
  version: options.version ?? '1.0.0',
  baseURL: `/api/plugins/${name}/`,
  extensions: [],
  loadScripts: [],
  registrationMethod: 'callback',
  customProperties: options.customProperties,
});

export const createTestPluginStore = (
  setup?: (store: TestPluginStore) => void,
): TestPluginStore => {
  const pluginStore = new TestPluginStore({
    autoEnableLoadedPlugins: true,
    loader: noopPluginLoader,
  });
  setup?.(pluginStore);
  return pluginStore;
};

export const addLoadedPlugin = (
  store: TestPluginStore,
  name: string,
  options: PluginManifestOptions = {},
): void => {
  store.addLoadedPlugin(createRemotePluginManifest(name, options), []);
};

export const addPendingPlugin = (store: TestPluginStore, name: string): void => {
  store.addPendingPlugin(createRemotePluginManifest(name));
};

export const addFailedPlugin = (
  store: TestPluginStore,
  name: string,
  errorMessage: string,
): void => {
  store.addFailedPlugin(createRemotePluginManifest(name), errorMessage);
};

export const addLoadedPluginWithoutVersion = (store: TestPluginStore, name: string): void => {
  const manifest = createRemotePluginManifest(name);
  delete (manifest as { version?: string }).version;
  store.addLoadedPlugin(manifest, []);
};
