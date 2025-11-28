import { ConsolePluginManifest } from '../build-types';

export const getPluginID = (m: ConsolePluginManifest) => `${m.name}@${m.version}`;
