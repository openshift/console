import { ClusterRoleKind } from '../hooks';

export const clusterRolesMock: ClusterRoleKind[] = [
  {
    kind: 'ClusterRole',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: {
      name: 'admin',
      uid: '44570fdb-665b-40bd-9094-b58ab8b8455a',
      resourceVersion: '46507',
      creationTimestamp: '2021-04-15T11:29:05Z',
      labels: {
        'olm.opgroup.permissions/aggregate-to-4fa8c5d8e33af72a-edit': 'true',
        'rbac.authorization.k8s.io/aggregate-to-edit': 'true',
      },
      ownerReferences: [
        {
          apiVersion: 'apiextensions.k8s.io/v1',
          kind: 'CustomResourceDefinition',
          name: 'knativeeventings.operator.knative.dev',
          uid: '3480f69a-6b16-48ff-993b-5e53087b7c49',
          controller: false,
          blockOwnerDeletion: false,
        },
      ],
    },
    rules: [
      {
        verbs: ['create', 'update', 'patch', 'delete'],
        apiGroups: ['operator.knative.dev'],
        resources: ['knativeeventings'],
      },
    ],
  },
  {
    kind: 'ClusterRole',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: {
      name: 'edit',
      uid: 'e5ee7365-1d7a-4db3-80df-5c0dbe936200',
      resourceVersion: '46488',
      creationTimestamp: '2021-04-15T11:29:04Z',
      labels: {
        'olm.opgroup.permissions/aggregate-to-fceaacb4e1c6ac8c-edit': 'true',
        'rbac.authorization.k8s.io/aggregate-to-edit': 'true',
      },
      ownerReferences: [
        {
          apiVersion: 'apiextensions.k8s.io/v1',
          kind: 'CustomResourceDefinition',
          name: 'knativeservings.operator.knative.dev',
          uid: 'ba4ade8a-2f00-48d4-9c75-725641274dde',
          controller: false,
          blockOwnerDeletion: false,
        },
      ],
    },
    rules: [
      {
        verbs: ['create', 'update', 'patch', 'delete'],
        apiGroups: ['operator.knative.dev'],
        resources: ['knativeservings'],
      },
    ],
  },
  {
    kind: 'ClusterRole',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: {
      name: 'monitoring-rules-view',
      uid: '189b9d7b-05a8-4186-8f7e-ce6af9b7c99f',
      resourceVersion: '3613',
      creationTimestamp: '2021-04-15T10:21:11Z',
    },
    rules: [
      {
        verbs: ['get', 'list', 'watch'],
        apiGroups: ['monitoring.coreos.com'],
        resources: ['prometheusrules'],
      },
    ],
  },
  {
    kind: 'ClusterRole',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: {
      name: 'basic-user',
      uid: 'd92176ec-4274-447d-bfd3-2d8d22363147',
      resourceVersion: '50391',
      creationTimestamp: '2021-04-15T11:34:14Z',
      labels: { 'eventing.knative.dev/release': 'v0.19.2' },
      annotations: {
        'kubectl.kubernetes.io/last-applied-configuration':
          '{"apiVersion":"rbac.authorization.k8s.io/v1","kind":"ClusterRole","metadata":{"labels":{"eventing.knative.dev/release":"v0.19.2"},"name":"knative-eventing-mt-broker-filter"},"rules":[{"apiGroups":["eventing.knative.dev"],"resources":["triggers","triggers/status"],"verbs":["get","list","watch"]},{"apiGroups":[""],"resources":["configmaps"],"verbs":["get","list","watch"]}]}\n',
      },
    },
    rules: [
      {
        verbs: ['get', 'list', 'watch'],
        apiGroups: ['snapshot.storage.k8s.io'],
        resources: ['volumesnapshotclasses'],
      },
      { verbs: ['get', 'list', 'watch'], apiGroups: [''], resources: ['configmaps'] },
    ],
  },
  {
    kind: 'ClusterRole',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: {
      name: '3scale-kourier',
      uid: 'd92176ec-4274-447d-bfd3-2d8d22363147',
      resourceVersion: '50391',
      creationTimestamp: '2021-04-15T11:34:14Z',
      labels: { 'eventing.knative.dev/release': 'v0.19.2' },
      annotations: {
        'console.openshift.io/display-name': '3Scale kourier',
        'kubectl.kubernetes.io/last-applied-configuration':
          '{"apiVersion":"rbac.authorization.k8s.io/v1","kind":"ClusterRole","metadata":{"labels":{"eventing.knative.dev/release":"v0.19.2"},"name":"knative-eventing-mt-broker-filter"},"rules":[{"apiGroups":["eventing.knative.dev"],"resources":["triggers","triggers/status"],"verbs":["get","list","watch"]},{"apiGroups":[""],"resources":["configmaps"],"verbs":["get","list","watch"]}]}\n',
      },
    },
    rules: [
      {
        verbs: ['get', 'list', 'watch'],
        apiGroups: ['snapshot.storage.k8s.io'],
        resources: ['volumesnapshotclasses'],
      },
      { verbs: ['get', 'list', 'watch'], apiGroups: [''], resources: ['configmaps'] },
    ],
  },
  {
    kind: 'ClusterRole',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: {
      name: 'cluster-debugger',
      uid: 'd92176ec-4274-447d-bfd3-2d8d22363147',
      resourceVersion: '50391',
      creationTimestamp: '2021-04-15T11:34:14Z',
      labels: { 'eventing.knative.dev/release': 'v0.19.2' },
      annotations: {
        'console.openshift.io/display-name': 'Cluster Debugger',
        'kubectl.kubernetes.io/last-applied-configuration':
          '{"apiVersion":"rbac.authorization.k8s.io/v1","kind":"ClusterRole","metadata":{"labels":{"eventing.knative.dev/release":"v0.19.2"},"name":"knative-eventing-mt-broker-filter"},"rules":[{"apiGroups":["eventing.knative.dev"],"resources":["triggers","triggers/status"],"verbs":["get","list","watch"]},{"apiGroups":[""],"resources":["configmaps"],"verbs":["get","list","watch"]}]}\n',
      },
    },
    rules: [
      {
        verbs: ['get', 'list', 'watch'],
        apiGroups: ['snapshot.storage.k8s.io'],
        resources: ['volumesnapshotclasses'],
      },
      { verbs: ['get', 'list', 'watch'], apiGroups: [''], resources: ['configmaps'] },
    ],
  },
];
