import { LoadedExtension, Perspective } from '@console/plugin-sdk';

export const mockPerspectiveExtensions: LoadedExtension<Perspective>[] = [
  {
    type: 'Perspective',
    properties: {
      id: 'acm',
      name: 'ACM',
      icon: null,
      getLandingPageURL: () => '',
      getK8sLandingPageURL: () => '',
      getImportRedirectURL: () => '',
    },
    pluginID: '',
    pluginName: '',
    uid: '',
  },
  {
    type: 'Perspective',
    properties: {
      id: 'admin',
      name: 'Administrator',
      icon: null,
      getLandingPageURL: () => '',
      getK8sLandingPageURL: () => '',
      getImportRedirectURL: () => '',
    },
    pluginID: '',
    pluginName: '',
    uid: '',
  },
  {
    type: 'Perspective',
    properties: {
      id: 'dev',
      name: 'Developer',
      icon: null,
      getLandingPageURL: () => '',
      getK8sLandingPageURL: () => '',
      getImportRedirectURL: () => '',
    },
    pluginID: '',
    pluginName: '',
    uid: '',
  },
];
