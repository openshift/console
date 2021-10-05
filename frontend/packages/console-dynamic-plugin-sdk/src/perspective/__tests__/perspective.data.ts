import { Perspective } from '../../extensions/perspectives';
import { LoadedExtension } from '../../types';

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
