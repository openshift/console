import * as React from 'react';
import { CatalogIcon } from '@patternfly/react-icons';
import { AddActionGroup, ResolvedExtension, AddAction } from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/plugin-sdk/src';

type AddActionExtension = ResolvedExtension<AddAction>;
type AddActionGroupExtension = LoadedExtension<AddActionGroup>;

// AddAction extensions
const allServices: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    description: 'Browse the catalog to discover, deploy and connect to services',
    groupId: 'developer-catalog',
    href: '/catalog',
    icon: <CatalogIcon />,
    id: 'dev-catalog',
    label: 'From Catalog',
  },
  type: 'dev-console.add/action',
  uid: '@console/dev-console[43]',
};

const database: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    description: 'Browse the catalog to discover database services to add to your Application',
    groupId: 'developer-catalog',
    href: '/catalog?category=databases',
    icon: <CatalogIcon />,
    id: 'dev-catalog-databases',
    label: 'Database',
  },
  type: 'dev-console.add/action',
  uid: '@console/dev-console[44]',
};

const operatorBacked: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    description: 'Browse the catalog to discover and deploy operator managed services',
    groupId: 'developer-catalog',
    href: '/catalog?catalogType=OperatorBackedService',
    icon: <CatalogIcon />,
    id: 'operator-backed',
    label: 'Operator Backed',
  },
  type: 'dev-console.add/action',
  uid: '@console/dev-console[45]',
};

const helmChart: AddActionExtension = {
  flags: { required: ['OPENSHIFT_HELM'], disallowed: [] },
  pluginID: '@console/helm-plugin',
  pluginName: '@console/helm-plugin',
  properties: {
    description: 'Browse the catalog to discover and install Helm Charts',
    groupId: 'developer-catalog',
    href: '/catalog?catalogType=HelmChart',
    icon: 'static/assets/helm.svg',
    id: 'helm',
    label: 'Helm Chart',
  },
  type: 'dev-console.add/action',
  uid: '@console/helm-plugin[12]',
};

const fromGit: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    accessReview: [
      {
        group: 'build.openshift.io',
        resource: 'buildconfigs',
        verb: 'create',
      },
    ],
    description: 'Import code from your Git repository to be built and deployed',
    groupId: 'git-repository',
    href: '/import',
    icon: 'static/assets/from-git.svg',
    id: 'import-from-git',
    label: 'From Git',
  },
  type: 'dev-console.add/action',
  uid: '@console/dev-console[38]',
};

const fromDevfile: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    accessReview: [
      {
        group: 'build.openshift.io',
        resource: 'buildconfigs',
        verb: 'create',
      },
    ],
    description: 'Import your Devfile from your Git repository to be built and deployed',
    groupId: 'git-repository',
    href: '/import?importType=devfile',
    icon: 'static/assets/devfile.svg',
    id: 'import-from-devfile',
    label: 'From Devfile',
  },
  type: 'dev-console.add/action',
  uid: '@console/dev-console[39]',
};

const fromDockerFile: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    accessReview: [
      {
        group: 'build.openshift.io',
        resource: 'buildconfigs',
        verb: 'create',
      },
    ],
    description: 'Import your Dockerfile from your Git repository to be built and deployed',
    groupId: 'git-repository',
    href: '/import?importType=docker',
    icon: 'static/assets/dockerfile.svg',
    id: 'import-from-dockerfile',
    label: 'From Dockerfile',
  },
  type: 'dev-console.add/action',
  uid: '@console/dev-console[41]',
};

const containerImagesAction: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    accessReview: [
      {
        group: 'build.openshift.io',
        resource: 'buildconfigs',
        verb: 'create',
      },
    ],
    description: 'Deploy an existing Image from an Image registry or Image stream tag',
    groupId: 'container-images',
    href: '/deploy-image',
    icon: <CatalogIcon />,
    id: 'deploy-image',
    label: 'Container images',
  },
  type: 'dev-console.add/action',
  uid: '@console/dev-console[40]',
};

const eventSource: AddActionExtension = {
  flags: { required: ['KNATIVE_EVENTING'], disallowed: [] },
  pluginID: '@console/knative-plugin',
  pluginName: '@console/knative-plugin',
  properties: {
    description:
      'Create an Event source to register interest in a class of events from a particular system',
    groupId: 'developer-catalog',
    href: '/catalog?catalogType=EventSource',
    icon: 'static/assets/event-source.svg',
    id: 'knative-event-source',
    label: 'Event Source',
  },
  type: 'dev-console.add/action',
  uid: '@console/knative-plugin[50]',
};

const channel: AddActionExtension = {
  flags: { required: ['KNATIVE_EVENTING', 'FLAG_KNATIVE_EVENTING_CHANNEL'], disallowed: [] },
  pluginID: '@console/knative-plugin',
  pluginName: '@console/knative-plugin',
  properties: {
    description:
      'Create a Knative Channel to create an event forwarding and persistence layer with in-memory and reliable implementations',
    groupId: 'serverless',
    href: '/channel',
    icon: 'static/assets/channel.svg',
    id: 'knative-eventing-channel',
    label: 'Channel',
  },
  type: 'dev-console.add/action',
  uid: '@console/knative-plugin[51]',
};

const importYaml: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    description: 'Create resources from their YAML or JSON definitions',
    groupId: 'local-machine',
    href: '/k8s/ns/:namespace/import',
    icon: 'static/assets/yaml.svg',
    id: 'import-yaml',
    label: 'Import YAML',
  },
  type: 'dev-console.add/action',
  uid: '@console/dev-console[42]',
};

const uploadJar: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    description: 'Upload a JAR file from your local desktop to OpenShift',
    groupId: 'local-machine',
    href: '/upload-jar',
    icon: <CatalogIcon />,
    id: 'upload-jar',
    label: 'Upload JAR file',
  },
  type: 'dev-console.add/action',
  uid: '@console/dev-console[46]',
};

const pipelinesAction: AddActionExtension = {
  flags: { required: ['OPENSHIFT_PIPELINE'], disallowed: [] },
  pluginID: '@console/pipelines-plugin',
  pluginName: '@console/pipelines-plugin',
  properties: {
    accessReview: [
      {
        group: 'tekton.dev',
        resource: 'pipelines',
        verb: 'create',
      },
    ],
    description: 'Create a Tekton Pipeline to automate delivery of your Application',
    groupId: 'pipelines',
    href: '/k8s/ns/:namespace/tekton.dev~v1beta1~Pipeline/~new/builder',
    icon: 'static/assets/pipeline.svg',
    id: 'pipeline',
    label: 'Pipelines',
  },
  type: 'dev-console.add/action',
  uid: '@console/pipelines-plugin[40]',
};

const actionWithoutGroupId: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/add-page-test-data',
  pluginName: '@console/add-page-test-data',
  properties: {
    description: 'This is an action without a groupId',
    href: '/',
    icon: <CatalogIcon />,
    id: 'no-groupId',
    label: 'Action Without GroupId',
  },
  type: 'dev-console.add/action',
  uid: '@console/add-page-test-data[0]',
};

const actionWithUnavailableGroupId: AddActionExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/add-page-test-data',
  pluginName: '@console/add-page-test-data',
  properties: {
    description:
      'This is an action with a groupId that is not available in the add group extensions',
    groupId: 'alien-group',
    href: '/',
    icon: <CatalogIcon />,
    id: 'alien-groupId',
    label: 'Action With Unavailable GroupId',
  },
  type: 'dev-console.add/action',
  uid: '@console/add-page-test-data[0]',
};

// AddActionGroup extensions

const developerCatalog: AddActionGroupExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    id: 'developer-catalog',
    name: 'Developer Catalog',
    insertBefore: 'git-repository',
  },
  type: 'dev-console.add/action-group',
  uid: '@console/dev-console[33]',
};

const gitRepository: AddActionGroupExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    id: 'git-repository',
    name: 'Git Repository',
    insertBefore: 'container-images',
    insertAfter: 'developer-catalog',
  },
  type: 'dev-console.add/action-group',
  uid: '@console/dev-console[34]',
};

const containerImagesActionGroup: AddActionGroupExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    id: 'container-images',
    name: 'Container images',
    insertBefore: 'serverless',
    insertAfter: 'git-repository',
  },
  type: 'dev-console.add/action-group',
  uid: '@console/dev-console[35]',
};

const localMachine: AddActionGroupExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/dev-console',
  pluginName: '@console/dev-console',
  properties: {
    id: 'local-machine',
    name: 'From Local Machine',
    insertBefore: 'pipelines',
    insertAfter: 'serverless',
  },
  type: 'dev-console.add/action-group',
  uid: '@console/dev-console[36]',
};

const serverless: AddActionGroupExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/knative-plugin',
  pluginName: '@console/knative-plugin',
  properties: {
    id: 'serverless',
    name: 'Serverless',
    insertBefore: 'local-machine',
    insertAfter: 'container-images',
  },
  type: 'dev-console.add/action-group',
  uid: '@console/knative-plugin[49]',
};

const pipelinesActionGroup: AddActionGroupExtension = {
  flags: { required: [], disallowed: [] },
  pluginID: '@console/pipelines-plugin',
  pluginName: '@console/pipelines-plugin',
  properties: {
    id: 'pipelines',
    name: 'Pipelines',
    insertAfter: 'local-machine',
  },
  type: 'dev-console.add/action-group',
  uid: '@console/pipelines-plugin[39]',
};

export const addActionExtensions: AddActionExtension[] = [
  allServices,
  database,
  operatorBacked,
  helmChart,
  fromGit,
  fromDevfile,
  fromDockerFile,
  containerImagesAction,
  eventSource,
  channel,
  importYaml,
  uploadJar,
  pipelinesAction,
];

export const addActionsWithoutValidGroupId: AddActionExtension[] = [
  actionWithoutGroupId,
  actionWithUnavailableGroupId,
];

export const addActionGroup: AddActionGroup['properties'][] = [
  containerImagesActionGroup.properties,
  developerCatalog.properties,
  pipelinesActionGroup.properties,
  serverless.properties,
  gitRepository.properties,
  localMachine.properties,
];

export const addActionGroupExtensions: AddActionGroupExtension[] = [
  containerImagesActionGroup,
  developerCatalog,
  pipelinesActionGroup,
  serverless,
  gitRepository,
  localMachine,
];
