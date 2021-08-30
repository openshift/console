import { Perspective } from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/plugin-sdk';

export const mockPerspectiveExtensions: LoadedExtension<Perspective>[] = [
  {
    type: 'console.perspective',
    properties: {
      id: 'acm',
      name: 'ACM',
      icon: null,
      landingPageURL: async () => () => '',
      importRedirectURL: async () => () => '',
    },
    pluginID: '',
    pluginName: '',
    uid: '',
  },
  {
    type: 'console.perspective',
    properties: {
      id: 'admin',
      name: 'Administrator',
      icon: null,
      landingPageURL: async () => () => '',
      importRedirectURL: async () => () => '',
    },
    pluginID: '',
    pluginName: '',
    uid: '',
  },
  {
    type: 'console.perspective',
    properties: {
      id: 'dev',
      name: 'Developer',
      icon: null,
      landingPageURL: async () => () => '',
      importRedirectURL: async () => () => '',
    },
    pluginID: '',
    pluginName: '',
    uid: '',
  },
];
