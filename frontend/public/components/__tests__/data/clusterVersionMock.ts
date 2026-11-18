import type { ClusterVersionKind } from '../../../module/k8s';

export const clusterVersionUpgradeableFalseProps: ClusterVersionKind = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: {
    creationTimestamp: '2020-08-05T17:21:42Z',
    generation: 1,
    name: 'version',
    resourceVersion: '22513',
    uid: '21194fa6-7058-47cb-9d45-782a666dd146',
  },
  spec: {
    channel: 'stable-4.5',
    clusterID: '727841c6-242d-4592-90d1-699925c4cfba',
    upstream: 'https://api.openshift.com/api/upgrades_info/v1/graph',
  },
  status: {
    availableUpdates: [
      {
        image:
          'quay.io/openshift-release-dev/ocp-release@sha256:02dfcae8f6a67e715380542654c952c981c59604b1ba7f569b13b9e5d0fbbed3',
        version: '4.5.4',
      },
    ],
    conditions: [
      {
        lastTransitionTime: '2020-08-05T17:49:47Z',
        message: 'Done applying 4.5.2',
        status: 'True',
        type: 'Available',
      },
      {
        lastTransitionTime: '2020-08-05T17:34:57Z',
        status: 'False',
        type: 'Failing',
      },
      {
        lastTransitionTime: '2020-08-05T17:49:47Z',
        message: 'Cluster version is 4.5.2',
        status: 'False',
        type: 'Progressing',
      },
      {
        lastTransitionTime: '2020-08-05T17:21:48Z',
        status: 'True',
        type: 'RetrievedUpdates',
      },
      {
        lastTransitionTime: '2020-08-05T17:21:48Z',
        message:
          'Cluster operator testing cannot be upgraded between minor versions: The whatsits are broken.',
        reason: 'Testing',
        status: 'False',
        type: 'Upgradeable',
      },
    ],
    desired: {
      image:
        'registry.svc.ci.openshift.org/ocp/release@sha256:8f923b7b8efdeac619eb0e7697106c1d17dd3d262c49d8742b38600417cf7d1d',
      version: '4.5.2',
      channels: ['stable-4.5', 'stable-4.6'],
    },
    history: [
      {
        completionTime: '2020-08-05T17:49:47Z',
        image:
          'registry.svc.ci.openshift.org/ocp/release@sha256:8f923b7b8efdeac619eb0e7697106c1d17dd3d262c49d8742b38600417cf7d1d',
        startedTime: '2020-08-05T17:21:48Z',
        state: 'Completed',
        verified: false,
        version: '4.5.2',
      },
    ],
    observedGeneration: 1,
    versionHash: 'yHX6PmE5llA=',
  },
};
