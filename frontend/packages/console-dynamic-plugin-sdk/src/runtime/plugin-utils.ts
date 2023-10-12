import { StandardConsolePluginManifest } from '../build-types';

export const getPluginID = (m: StandardConsolePluginManifest) => `${m.name}@${m.version}`;
