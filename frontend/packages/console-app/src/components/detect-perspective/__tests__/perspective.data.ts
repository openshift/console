import { LoadedExtension, Perspective } from '@console/plugin-sdk/src';

export const mockPerspectiveExtensions: LoadedExtension<Perspective>[] = [
  {
    type: 'Perspective',
    pluginID: '',
    pluginName: '',
    uid: '',
    properties: {
      id: 'dev',
      name: 'Developer',
      icon: null,
      getLandingPageURL: () => '',
      getK8sLandingPageURL: () => '',
      getImportRedirectURL: () => '',
    },
  },
  {
    type: 'Perspective',
    pluginID: '',
    pluginName: '',
    uid: '',
    properties: {
      id: 'admin',
      name: 'Administrator',
      icon: null,
      getLandingPageURL: () => '',
      getK8sLandingPageURL: () => '',
      getImportRedirectURL: () => '',
    },
  },
];
