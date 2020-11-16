import { CatalogItemProvider, CatalogItemType, Plugin } from '@console/plugin-sdk';
import { builderImageProvider, helmChartProvider, templateProvider } from './providers';

export type CatalogConsumedExtensions = CatalogItemProvider | CatalogItemType;

export const catalogPlugin: Plugin<CatalogConsumedExtensions> = [
  {
    type: 'Catalog/ItemType',
    properties: {
      type: 'BuilderImage',
      title: 'Builder Images',
      catalogDescription:
        'Browse for container images that support a particular language or framework. Cluster administrators can customize the content made available in the catalog.',
      typeDescription:
        '**Builder images** are container images that build source code for a  particular language or framework.',
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
      title: 'Templates',
      catalogDescription:
        'Browse for templates that can deploy services, create builds, or create any resources the template enables. Cluster administrators can customize the content made available in the catalog.',
      typeDescription:
        '**Templates** are sets of objects for creating services, build configurations, and anything you have permission to create within a project.',
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
  {
    type: 'Catalog/ItemType',
    properties: {
      type: 'HelmChart',
      title: 'Helm Charts',
      catalogDescription:
        'Browse for charts that help manage complex installations and upgrades. Cluster administrators can customize the content made available in the catalog.',
      typeDescription:
        '**Helm charts** are packages for deploying an application or components of a larger application.',
      filters: [
        {
          label: 'Chart Repositories',
          attribute: 'chartRepositoryName',
        },
      ],
    },
  },
  {
    type: 'Catalog/ItemProvider',
    properties: {
      type: 'HelmChart',
      provider: helmChartProvider,
    },
  },
];
