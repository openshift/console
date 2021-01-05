import { CatalogItemProvider, CatalogItemType, Plugin } from '@console/plugin-sdk';
import { builderImageProvider, templateProvider } from './providers';

export type CatalogConsumedExtensions = CatalogItemProvider | CatalogItemType;

export const catalogPlugin: Plugin<CatalogConsumedExtensions> = [
  {
    type: 'Catalog/ItemType',
    properties: {
      type: 'BuilderImage',
      // t('devconsole~Builder Images')
      title: '%devconsole~Builder Images%',
      // t('devconsole~Browse for container images that support a particular language or framework. Cluster administrators can customize the content made available in the catalog.')
      catalogDescription:
        '%devconsole~Browse for container images that support a particular language or framework. Cluster administrators can customize the content made available in the catalog.%',
      // t('devconsole~**Builder Images** are container images that build source code for a particular language or framework.')
      typeDescription:
        '%devconsole~**Builder Images** are container images that build source code for a particular language or framework.%',
    },
    flags: {
      required: ['OPENSHIFT'],
    },
  },
  {
    type: 'Catalog/ItemProvider',
    properties: {
      type: 'BuilderImage',
      provider: builderImageProvider,
    },
    flags: {
      required: ['OPENSHIFT'],
    },
  },
  {
    type: 'Catalog/ItemType',
    properties: {
      type: 'Template',
      // t('devconsole~Templates')
      title: '%devconsole~Templates%',
      // t('devconsole~Browse for templates that can deploy services, create builds, or create any resources the template enables. Cluster administrators can customize the content made available in the catalog.')
      catalogDescription:
        '%devconsole~Browse for templates that can deploy services, create builds, or create any resources the template enables. Cluster administrators can customize the content made available in the catalog.%',
      // t('devconsole~**Templates** are sets of objects for creating services, build configurations, and anything you have permission to create within a Project.')
      typeDescription:
        '%devconsole~**Templates** are sets of objects for creating services, build configurations, and anything you have permission to create within a Project.%',
    },
    flags: {
      required: ['OPENSHIFT'],
    },
  },
  {
    type: 'Catalog/ItemProvider',
    properties: {
      type: 'Template',
      provider: templateProvider,
    },
    flags: {
      required: ['OPENSHIFT'],
    },
  },
];
