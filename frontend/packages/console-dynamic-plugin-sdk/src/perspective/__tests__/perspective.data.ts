import { ACM_PERSPECTIVE_ID } from '@console/app/src/consts';
import { Perspective } from '../../extensions/perspectives';
import { LoadedExtension } from '../../types';

export const acmPerspectiveExtension: LoadedExtension<Perspective> = {
  type: 'console.perspective',
  pluginID: '',
  pluginName: '',
  uid: '',
  properties: {
    id: ACM_PERSPECTIVE_ID,
    name: 'All Clusters',
    icon: null,
    landingPageURL: async () => () => '',
    importRedirectURL: async () => () => '',
  },
};

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
  acmPerspectiveExtension,
];
