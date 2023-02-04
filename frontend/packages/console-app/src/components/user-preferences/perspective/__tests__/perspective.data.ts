import { ACM_PERSPECTIVE_ID } from '@console/app/src/consts';
import { Perspective } from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/plugin-sdk';

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
