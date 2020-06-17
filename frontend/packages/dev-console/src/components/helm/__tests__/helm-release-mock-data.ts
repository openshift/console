import { K8sResourceKind } from '@console/internal/module/k8s';
import { HelmRelease, HelmChartMetaData } from '../helm-types';

/* eslint-disable @typescript-eslint/camelcase */
export const mockHelmReleases: HelmRelease[] = [
  {
    name: 'ghost-test',
    info: {
      first_deployed: '2020-01-20T15:46:47.776679107+05:30',
      last_deployed: '2020-01-20T15:46:47.776679107+05:30',
      deleted: '',
      description: 'Install complete',
      status: 'deployed',
      notes: 'ghost-test release notes',
    },
    chart: {
      metadata: {
        name: 'ghost',
        home: 'http://www.ghost.org/',
        sources: ['https://github.com/bitnami/bitnami-docker-ghost'],
        version: '9.0.2',
        description:
          'A simple, powerful publishing platform that allows you to share your stories with the world',
        keywords: ['ghost', 'blog', 'http', 'web', 'application', 'nodejs', 'javascript'],
        maintainers: [
          {
            name: 'Bitnami',
            email: 'containers@bitnami.com',
          },
        ],
        icon: 'https://bitnami.com/assets/stacks/ghost/img/ghost-stack-220x234.png',
        apiVersion: 'v1',
        appVersion: '3.1.0',
        dependencies: [
          {
            name: 'mariadb',
            version: '7.x.x',
            repository: 'https://kubernetes-charts.storage.googleapis.com/',
            condition: 'mariadb.enabled',
            tags: ['ghost-database'],
            enabled: true,
          },
        ],
        urls: ['https://kubernetes-charts/repo/community/mariadb-1.0.1.tgz'],
      },
      lock: {
        generated: '2019-11-27T17:17:48.26496196Z',
        digest: 'sha256:27bef733eb099a7377055cfe2c48e013bd4d55650ff18b50138c80488c812b0b',
        dependencies: [
          {
            name: 'mariadb',
            version: '7.1.0',
            repository: 'https://kubernetes-charts.storage.googleapis.com/',
          },
        ],
      },
      templates: [],
      values: {},
      schema: '',
      files: [{ name: 'README.md', data: btoa('example readme content') }],
    },
    manifest: '',
    hooks: [],
    version: 1,
    namespace: 'test-helm',
  },
  {
    name: 'node-test-chart',
    info: {
      first_deployed: '2020-01-20T15:12:04.19900271+05:30',
      last_deployed: '2020-01-20T15:12:04.19900271+05:30',
      deleted: '',
      description: 'Install complete',
      status: 'failed',
      notes: '',
    },
    chart: {
      metadata: {
        name: 'nodejs-ex-k',
        version: '0.1.0',
        description: 'A Helm chart for Kubernetes',
        apiVersion: 'v2',
        appVersion: '1.16.0',
        type: 'application',
        urls: ['https://kubernetes-charts/repo/community/nodejs-0.1.0.tgz'],
      },
      lock: null,
      templates: [],
      values: {},
      schema: null,
      files: [],
    },
    manifest: '',
    version: 1,
    namespace: 'test-helm',
  },
  {
    name: 'node-test-chart',
    info: {
      first_deployed: '2020-01-20T15:12:04.19900271+05:30',
      last_deployed: '2020-01-20T15:12:04.19900271+05:30',
      deleted: '',
      description: 'Install complete',
      status: 'pending-install',
      notes: 'node-test-chart release notes',
    },
    chart: {
      metadata: {
        name: 'nodejs-ex-k',
        version: '0.1.0',
        description: 'A Helm chart for Kubernetes',
        apiVersion: 'v2',
        appVersion: '1.16.0',
        type: 'application',
        urls: ['https://kubernetes-charts/repo/community/nodejs-0.1.tgz'],
      },
      lock: null,
      templates: [],
      values: {},
      schema: null,
      files: [],
    },
    manifest: '',
    version: 1,
    namespace: 'test-helm',
  },
];

export const mockHelmChartData: HelmChartMetaData[] = [
  {
    appVersion: '3.12',
    apiVersion: 'v1',
    description: 'xyz',
    name: 'hazelcast-enterprise',
    urls: [
      'https://raw.githubusercontent.com/IBM/charts/master/repo/community/hazelcast-enterprise-1.0.3.tgz',
    ],
    version: '1.0.3',
  },
  {
    appVersion: '3.12',
    apiVersion: 'v1',
    description: 'abc',
    name: 'hazelcast-enterprise',
    urls: [
      'https://raw.githubusercontent.com/IBM/charts/master/repo/community/hazelcast-enterprise-1.0.2.tgz',
    ],
    version: '1.0.2',
    kubeVersion: '>=1.10.0',
  },
  {
    appVersion: '3.10.5',
    apiVersion: 'v1',
    description: 'efg',
    name: 'hazelcast-enterprise',
    urls: [
      'https://raw.githubusercontent.com/IBM/charts/master/repo/community/hazelcast-enterprise-1.0.1.tgz',
    ],
    version: '1.0.1',
    kubeVersion: '>=1.11.0',
  },
];

export const mockReleaseResources: {
  [key: string]: { data: K8sResourceKind };
} = {
  Deployment: {
    data: {
      kind: 'Deployment',
      metadata: {
        name: 'helm-mysql',
        namespace: 'xyz',
      },
    },
  },
  StatefulSet: {
    data: {
      kind: 'StatefulSet',
      metadata: {
        name: 'helm-mysql',
        namespace: 'xyz',
      },
    },
  },
  Pod: {
    data: {},
  },
};

export const flattenedMockReleaseResources = [
  { kind: 'Deployment', metadata: { name: 'helm-mysql', namespace: 'xyz' } },
  {
    kind: 'StatefulSet',
    metadata: { name: 'helm-mysql', namespace: 'xyz' },
  },
];
