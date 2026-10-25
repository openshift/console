import type {
  Extension,
  LoadedExtension,
  PluginManifest,
  LocalPluginManifest,
  RemotePluginManifest,
  PluginRuntimeMetadata,
  PluginLoaderInterface,
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

type PluginManifestOptions = Partial<Pick<PluginRuntimeMetadata, 'version' | 'customProperties'>>;

export const createLocalPluginManifest = (
  name: string,
  options: PluginManifestOptions = {},
): LocalPluginManifest => ({
  name,
  version: options.version ?? '1.0.0',
  extensions: [],
  registrationMethod: 'local',
  customProperties: options.customProperties,
});

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

const getLoadedExtensions = <T extends Extension>(
  pluginName: string,
  extensions: T[],
): LoadedExtension<T>[] =>
  extensions.map((e, index) => ({
    ...e,
    pluginName,
    uid: `${pluginName}[${index}]`,
  }));

export const addLoadedPluginFromManifest = (
  store: TestPluginStore,
  manifest: PluginManifest,
  extensions: Extension[],
  enablePlugin = true,
) => {
  store.addLoadedPlugin(manifest, getLoadedExtensions(manifest.name, extensions));

  if (enablePlugin) {
    store.enablePlugins([manifest.name]);
  }
};

export const addLoadedPlugin = (
  store: TestPluginStore,
  name: string,
  options: PluginManifestOptions = {},
) => {
  addLoadedPluginFromManifest(store, createRemotePluginManifest(name, options), []);
};

export const addPendingPlugin = (store: TestPluginStore, name: string) => {
  store.addPendingPlugin(createRemotePluginManifest(name));
};

export const addFailedPlugin = (store: TestPluginStore, name: string, errorMessage: string) => {
  store.addFailedPlugin(createRemotePluginManifest(name), errorMessage);
};

export const addLoadedPluginWithoutVersion = (store: TestPluginStore, name: string) => {
  const manifest = createRemotePluginManifest(name);
  delete (manifest as { version?: string }).version;
  store.addLoadedPlugin(manifest, []);
};
