import { Perspective } from '@console/dynamic-plugin-sdk/src';
import { LoadedExtension } from '@console/plugin-sdk/src';

export const mockPerspectiveExtensions: LoadedExtension<Perspective>[] = [
  {
    type: 'console.perspective',
    pluginID: '',
    pluginName: '',
    uid: '',
    properties: {
      id: 'dev',
      name: 'Developer',
      icon: null,
      landingPageURL: async () => () => '',
      importRedirectURL: async () => () => '',
    },
  },
  {
    type: 'console.perspective',
    pluginID: '',
    pluginName: '',
    uid: '',
    properties: {
      id: 'admin',
      name: 'Administrator',
      icon: null,
      landingPageURL: async () => () => '',
      importRedirectURL: async () => () => '',
    },
  },
];
