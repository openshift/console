/**
 * Mock cluster version data for testing channel modal behavior
 * Simplified from packages/integration-tests/mocks/cluster-version.ts
 */

const baseClusterVersion = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: {
    creationTimestamp: '2024-01-04T05:14:57Z',
    generation: 4,
    name: 'version',
    resourceVersion: '370626',
    uid: '40b1ad1b-13d2-4c7c-932a-ce78c4447ed8',
  },
  spec: {
    channel: 'stable-4.16',
    clusterID: '4976480a-15e1-4c94-bafe-aafb96bc0248',
    upstream: 'https://openshift-release.apps.ci.l2s4.p1.openshiftapps.com/graph',
  },
  status: {
    availableUpdates: [],
    conditions: [
      {
        lastTransitionTime: '2024-01-04T05:37:10Z',
        status: 'True',
        type: 'RetrievedUpdates',
      },
      {
        lastTransitionTime: '2024-01-04T05:15:00Z',
        message: 'Capabilities match configured spec',
        reason: 'AsExpected',
        status: 'False',
        type: 'ImplicitlyEnabledCapabilities',
      },
      {
        lastTransitionTime: '2024-01-04T05:15:00Z',
        message:
          'Payload loaded version="4.16.0" image="registry.ci.openshift.org/ocp/release@sha256:ff486203f5b065836105fcd56f29467229bfc6258e5d8ba7f479ac575d81c721" architecture="amd64"',
        reason: 'PayloadLoaded',
        status: 'True',
        type: 'ReleaseAccepted',
      },
      {
        lastTransitionTime: '2024-01-04T05:35:14Z',
        message: 'Done applying 4.16.0',
        status: 'True',
        type: 'Available',
      },
      {
        lastTransitionTime: '2024-01-04T05:35:14Z',
        status: 'False',
        type: 'Failing',
      },
      {
        lastTransitionTime: '2024-01-04T05:35:14Z',
        message: 'Cluster version is 4.16.0',
        status: 'False',
        type: 'Progressing',
      },
    ],
    desired: {
      image:
        'registry.ci.openshift.org/ocp/release@sha256:ff486203f5b065836105fcd56f29467229bfc6258e5d8ba7f479ac575d81c721',
      version: '4.16.0',
    },
    history: [
      {
        completionTime: '2024-01-04T05:35:14Z',
        image:
          'registry.ci.openshift.org/ocp/release@sha256:ff486203f5b065836105fcd56f29467229bfc6258e5d8ba7f479ac575d81c721',
        startedTime: '2024-01-04T05:15:00Z',
        state: 'Completed',
        verified: false,
        version: '4.16.0',
      },
    ],
    observedGeneration: 3,
    versionHash: 'rqBs61ZyVwQ=',
  },
};

const conditionUpgradeNoChannel = {
  lastTransitionTime: '2024-01-10T18:10:53Z',
  message: 'The update channel has not been configured.',
  reason: 'NoChannel',
  status: 'False',
  type: 'RetrievedUpdates',
};

const conditionProgressing = {
  lastTransitionTime: '2024-01-11T13:45:34Z',
  message: 'Cluster version is 4.16.0',
  status: 'True',
  type: 'Progressing',
};

const desired = {
  image:
    'registry.ci.openshift.org/ocp/release@sha256:ff486203f5b065836105fcd56f29467229bfc6258e5d8ba7f479ac575d81c721',
  version: '4.16.2',
};

const upsertCondition = (conditions: any[], nextCondition: any) => [
  ...conditions.filter((c: any) => c.type !== nextCondition.type),
  nextCondition,
];

/**
 * Cluster version with no channel configured
 */
export const clusterVersionWithoutChannel = JSON.parse(JSON.stringify(baseClusterVersion));
clusterVersionWithoutChannel.spec.channel = '';
clusterVersionWithoutChannel.status.conditions = upsertCondition(
  clusterVersionWithoutChannel.status.conditions,
  conditionUpgradeNoChannel,
);

/**
 * Cluster version with channel and available channels in desired.channels
 */
export const clusterVersionWithDesiredChannels = JSON.parse(JSON.stringify(baseClusterVersion));
clusterVersionWithDesiredChannels.status.desired.channels = [
  'stable-4.16',
  'candidate-4.16',
  'fast-4.16',
  'stable-4.17',
  'candidate-4.17',
  'fast-4.17',
];

/**
 * Cluster version with update in progress
 */
export const clusterVersionWithProgressing = JSON.parse(JSON.stringify(baseClusterVersion));
clusterVersionWithProgressing.status.conditions = upsertCondition(
  clusterVersionWithProgressing.status.conditions,
  conditionProgressing,
);
clusterVersionWithProgressing.spec.desired = desired;
clusterVersionWithProgressing.status.desired = desired;

const availableUpdates = [
  {
    image:
      'registry.ci.openshift.org/ocp/release@sha256:f31d5b0e23c8f978b57f5ef74c8811e7f87103187aa1895880f67eac4eb76f6d',
    version: '4.16.1',
  },
  {
    image:
      'registry.ci.openshift.org/ocp/release@sha256:f31d5b0e23c8f978b57f5ef74c8811e7f87103187aa1895880f67eac4eb76f6e',
    version: '4.16.2',
  },
  {
    image:
      'registry.ci.openshift.org/ocp/release@sha256:06cd433ae0036e3b79e2ecd08512abca540fbefe9805b225a6a9c33ca9456ad3',
    version: '4.17.0',
  },
  {
    image:
      'registry.ci.openshift.org/ocp/release@sha256:06cd433ae0036e3b79e2ecd08512abca540fbefe9805b225a6a9c33ca9456ad4',
    version: '4.17.1',
  },
];

const conditionalUpdates = [
  {
    release: {
      version: '4.16.3',
      image:
        'quay.io/openshift-release-dev/ocp-release@sha256:7082f01282a07f4033308ccadb1ca0c6acacadd83812d7cc1135a022f5382391',
      channels: ['candidate-4.16'],
    },
    risks: [
      {
        url: 'https://bugzilla.redhat.com/show_bug.cgi?id=2047190',
        name: 'AlibabaStorageDriverDemo',
        message:
          'The Alibaba storage driver was updated from a patched 1.1.4 to a patched 1.1.6 in 4.10.0-rc.0.',
        matchingRules: [
          {
            type: 'PromQL',
            promql: {
              promql:
                'cluster_infrastructure_provider{type="AlibabaCloud"} or 0 * cluster_infrastructure_provider',
            },
          },
        ],
      },
    ],
    conditions: [
      {
        type: 'Recommended',
        status: 'False',
        lastTransitionTime: '2024-02-03T22:53:33Z',
        reason: 'AlibabaStorageDriverDemo',
        message:
          'The Alibaba storage driver was updated from a patched 1.1.4 to a patched 1.1.6 in 4.10.0-rc.0.',
      },
    ],
  },
  {
    release: {
      version: '4.16.4',
      image:
        'quay.io/openshift-release-dev/ocp-release@sha256:7082f01282a07f4033308ccadb1ca0c6acacadd83812d7cc1135a022f5382391',
      channels: ['candidate-4.14'],
    },
    risks: [
      {
        url: 'https://bugzilla.redhat.com/show_bug.cgi?id=2047190',
        name: 'AlibabaStorageDriverDemo',
        message:
          'The Alibaba storage driver was updated from a patched 1.1.4 to a patched 1.1.6 in 4.10.0-rc.0.',
        matchingRules: [
          {
            type: 'PromQL',
            promql: {
              promql:
                'cluster_infrastructure_provider{type="AlibabaCloud"} or 0 * cluster_infrastructure_provider',
            },
          },
        ],
      },
    ],
    conditions: [
      {
        type: 'Recommended',
        status: 'False',
        lastTransitionTime: '2024-02-03T22:53:33Z',
        reason: 'AsExpected',
        message:
          'The update is recommended, because none of the conditional update risks apply to this cluster.',
      },
    ],
  },
];

/**
 * Cluster version with available updates
 */
export const clusterVersionWithAvailableUpdates = JSON.parse(JSON.stringify(baseClusterVersion));
clusterVersionWithAvailableUpdates.status.availableUpdates = availableUpdates;

/**
 * Cluster version with available and conditional updates
 */
export const clusterVersionWithAvailableAndConditionalUpdates = JSON.parse(
  JSON.stringify(clusterVersionWithAvailableUpdates),
);
clusterVersionWithAvailableAndConditionalUpdates.status.conditionalUpdates = conditionalUpdates;

/**
 * Cluster version with conditional updates only (no available updates)
 */
export const clusterVersionWithConditionalUpdates = JSON.parse(JSON.stringify(baseClusterVersion));
clusterVersionWithConditionalUpdates.status.conditionalUpdates = conditionalUpdates;

const conditionUpgradableFalse = {
  lastTransitionTime: '2024-01-04T05:45:29Z',
  message:
    'Cluster operator operator-lifecycle-manager should not be upgraded between minor versions: ClusterServiceVersions blocking cluster upgrade: openshift-operators/openshift-pipelines-operator-rh.v1.12.2 is incompatible with OpenShift minor versions greater than 4.14',
  reason: 'IncompatibleOperatorsInstalled',
  status: 'False',
  type: 'Upgradeable',
};

/**
 * Cluster version with Upgradeable=False condition
 */
export const clusterVersionWithUpgradeableFalse = JSON.parse(
  JSON.stringify(clusterVersionWithAvailableUpdates),
);
clusterVersionWithUpgradeableFalse.status.conditions.push(conditionUpgradableFalse);
