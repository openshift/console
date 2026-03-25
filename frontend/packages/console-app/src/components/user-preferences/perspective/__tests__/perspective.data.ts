import { ACM_PERSPECTIVE_ID } from '@console/app/src/consts';
import type { Perspective } from '@console/dynamic-plugin-sdk';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';

export const mockPerspectiveExtensions: LoadedExtension<Perspective>[] = [
  {
    type: 'console.perspective',
    properties: {
      id: ACM_PERSPECTIVE_ID,
      name: 'ACM',
      icon: null,
      landingPageURL: async () => () => '',
      importRedirectURL: async () => () => '',
    },
    pluginName: '',
    uid: '',
  },
  {
    type: 'console.perspective',
    properties: {
      id: 'admin',
      name: 'Core platform',
      icon: null,
      landingPageURL: async () => () => '',
      importRedirectURL: async () => () => '',
    },
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
    pluginName: '',
    uid: '',
  },
];
