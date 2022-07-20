import { ConsolePluginManifestJSON } from '../schema/plugin-manifest';

export const getPluginID = (m: ConsolePluginManifestJSON) => `${m.name}@${m.version}`;
