import { CatalogItemProvider, Plugin } from '@console/plugin-sdk';
import {
  builderImageProvider,
  helmChartProvider,
  serviceClassProvider,
  templateProvider,
} from './providers';

export type CatalogConsumedExtensions = CatalogItemProvider;

export const catalogPlugin: Plugin<CatalogConsumedExtensions> = [
  {
    type: 'Catalog/ItemProvider',
    properties: {
      type: 'BuilderImage',
      title: 'Builder Images',
      catalog: 'developer',
      provider: builderImageProvider,
      description: 'Add source-to-image builders to your project from the Developer Catalog.',
    },
    flags: {
      required: ['OPENSHIFT'],
    },
  },
  {
    type: 'Catalog/ItemProvider',
    properties: {
      type: 'Template',
      title: 'Templates',
      catalog: 'developer',
      provider: templateProvider,
      description: 'Add OpenShift templates to your project from the Developer Catalog.',
    },
    flags: {
      required: ['OPENSHIFT'],
    },
  },
  {
    type: 'Catalog/ItemProvider',
    properties: {
      type: 'ServiceClass',
      title: 'Service Class',
      catalog: 'developer',
      provider: serviceClassProvider,
      description: 'Add OpenShift service class to your project from the Developer Catalog.',
    },
    flags: {
      required: ['SERVICE_CATALOG'],
    },
  },
  {
    type: 'Catalog/ItemProvider',
    properties: {
      type: 'HelmChart',
      title: 'Helm Charts',
      catalog: 'developer',
      provider: helmChartProvider,
      description: 'Add OpenShift service class to your project from the Developer Catalog.',
    },
  },
];
