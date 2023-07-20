import { ConsoleSample } from '../../../../types';

export const gitImportSample: ConsoleSample = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'ConsoleSample',
  metadata: { name: 'nodeinfo-git-sample' },
  spec: {
    title: 'Nodeinfo Git Import example',
    abstract: 'Project to test OpenShift git s2i & Dockerfile import flow',
    description: '# About this project\nProject to test OpenShift git import flow\n',
    icon: 'data:image/svg+xml;base64,...',
    provider: 'Red Hat',
    type: 'Source to image',
    tags: ['JavaScript', 'Node.js', 's2i'],
    source: {
      type: 'GitImport',
      gitImport: {
        repository: {
          url: 'https://github.com/openshift-dev-console/nodejs-sample',
        },
      },
    },
  },
};

export const containerImportSample: ConsoleSample = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'ConsoleSample',
  metadata: { name: 'nodeinfo-container-sample' },
  spec: {
    title: 'Nodeinfo Container Import example',
    abstract: 'Project to test OpenShift import container image flow',
    description: '# About this project\nProject to test OpenShift import container image flow\n',
    icon: 'data:image/svg+xml;base64,...',
    provider: 'Red Hat',
    type: 'UBI Container',
    tags: ['JavaScript', 'Node.js', 's2i'],
    source: {
      type: 'ContainerImport',
      containerImport: {
        image: 'registry.access.redhat.com/ubi8/ubi-minimal:8.8-860',
      },
    },
  },
};
