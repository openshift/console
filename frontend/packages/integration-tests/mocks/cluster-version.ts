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
          'The Alibaba storage driver was updated from a patched 1.1.4 to a patched 1.1.6 in 4.10.0-rc.0.  That is unlikely to fix anything that regressed in this provider from fc.3 to fc.4, but this conditional update is pretending it does, as a demonstration of the conditional update system.',
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
          'The Alibaba storage driver was updated from a patched 1.1.4 to a patched 1.1.6 in 4.10.0-rc.0.  That is unlikely to fix anything that regressed in this provider from fc.3 to fc.4, but this conditional update is pretending it does, as a demonstration of the conditional update system.  https://bugzilla.redhat.com/show_bug.cgi?id=2047190',
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
          'The Alibaba storage driver was updated from a patched 1.1.4 to a patched 1.1.6 in 4.10.0-rc.0.  That is unlikely to fix anything that regressed in this provider from fc.3 to fc.4, but this conditional update is pretending it does, as a demonstration of the conditional update system.',
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

const conditionFailing = {
  lastTransitionTime: '2024-01-11T13:45:34Z',
  message: 'Cluster operator kube-storage-version-migrator has not yet reported success',
  status: 'True',
  type: 'Failing',
};

const conditionInvalid = {
  lastTransitionTime: '2024-01-11T13:15:41Z',
  message:
    'The cluster version is invalid: spec.desiredUpdate.version: Invalid value: "4.16.0-foo": when image is empty the update must be a previous version or an available update',
  status: 'True',
  type: 'Invalid',
};

const conditionProgressing = {
  lastTransitionTime: '2024-01-11T13:45:34Z',
  message: 'Cluster version is 4.16.0',
  status: 'True',
  type: 'Progressing',
};

const conditionReleaseAcceptedFalse = {
  lastTransitionTime: '2024-01-11T19:09:43Z',
  message:
    'Retrieving payload failed version="4.16.0-bar" image="registry.ci.openshift.org/ocp/release@sha256:7d7a1696145043c9d4653f27cc001da283ff4b39c915e226104d82cc56e0eeb9" failure=The update cannot be verified: unable to verify sha256:7d7a1696145043c9d4653f27cc001da283ff4b39c915e226104d82cc56e0eeb9 against keyrings: verifier-public-key-redhat',
  reason: 'RetrievePayload',
  status: 'False',
  type: 'ReleaseAccepted',
};

const conditionRetrievedUpdatesNotFound = {
  lastTransitionTime: '2024-01-11T13:15:41Z',
  message:
    'Unable to retrieve available updates: currently reconciling cluster version 4.16.0-foo not found in the "foo" channel',
  reason: 'VersionNotFound',
  status: 'False',
  type: 'RetrievedUpdates',
};

const conditionUpgradableFalse = {
  lastTransitionTime: '2024-01-04T05:45:29Z',
  message:
    'Cluster operator operator-lifecycle-manager should not be upgraded between minor versions: ClusterServiceVersions blocking cluster upgrade: openshift-operators/openshift-pipelines-operator-rh.v1.12.2 is incompatible with OpenShift minor versions greater than 4.14',
  reason: 'IncompatibleOperatorsInstalled',
  status: 'False',
  type: 'Upgradeable',
};

const conditionUpgradeNoChannel = {
  lastTransitionTime: '2024-01-10T18:10:53Z',
  message: 'The update channel has not been configured.',
  reason: 'NoChannel',
  status: 'False',
  type: 'RetrievedUpdates',
};

const desired = {
  image:
    'registry.ci.openshift.org/ocp/release@sha256:ff486203f5b065836105fcd56f29467229bfc6258e5d8ba7f479ac575d81c721',
  version: '4.16.2',
};

const desirecChannels = [
  'stable-4.16',
  'candidate-4.16',
  'fast-4.16',
  'stable-4.17',
  'candidate-4.17',
  'fast-4.17',
];

export const clusterVersion = {
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
    capabilities: {
      enabledCapabilities: [
        'Build',
        'CSISnapshot',
        'CloudCredential',
        'Console',
        'DeploymentConfig',
        'ImageRegistry',
        'Insights',
        'MachineAPI',
        'NodeTuning',
        'OperatorLifecycleManager',
        'Storage',
        'baremetal',
        'marketplace',
        'openshift-samples',
      ],
      knownCapabilities: [
        'Build',
        'CSISnapshot',
        'CloudCredential',
        'Console',
        'DeploymentConfig',
        'ImageRegistry',
        'Insights',
        'MachineAPI',
        'NodeTuning',
        'OperatorLifecycleManager',
        'Storage',
        'baremetal',
        'marketplace',
        'openshift-samples',
      ],
    },
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

export const clusterVersionWithAvailableUpdates = JSON.parse(JSON.stringify(clusterVersion));
clusterVersionWithAvailableUpdates.status.availableUpdates = availableUpdates;

export const clusterVersionWithAvailableAndConditionalUpdates = JSON.parse(
  JSON.stringify(clusterVersionWithAvailableUpdates),
);
clusterVersionWithAvailableAndConditionalUpdates.status.conditionalUpdates = conditionalUpdates;

export const clusterVersionWithConditionalUpdates = JSON.parse(JSON.stringify(clusterVersion));
clusterVersionWithConditionalUpdates.status.conditionalUpdates = conditionalUpdates;

export const clusterVersionWithDesiredChannels = JSON.parse(
  JSON.stringify(clusterVersionWithAvailableUpdates),
);
clusterVersionWithDesiredChannels.status.desired.channels = desirecChannels;

export const clusterVersionWithFailing = JSON.parse(JSON.stringify(clusterVersion));
clusterVersionWithFailing.status.conditions.push(conditionFailing);

export const clusterVersionWithInvalidChannel = JSON.parse(JSON.stringify(clusterVersion));
clusterVersionWithInvalidChannel.spec.channel = 'foo';
clusterVersionWithInvalidChannel.status.conditions.push(conditionRetrievedUpdatesNotFound);

export const clusterVersionWithInvalidRelease = JSON.parse(JSON.stringify(clusterVersion));
clusterVersionWithInvalidRelease.status.conditions.push(conditionInvalid);

export const clusterVersionWithProgressing = JSON.parse(JSON.stringify(clusterVersion));
clusterVersionWithProgressing.status.conditions.push(conditionProgressing);
clusterVersionWithProgressing.spec.desired = desired;
clusterVersionWithProgressing.status.desired = desired;

export const clusterVersionWithProgessingAndFailing = JSON.parse(JSON.stringify(clusterVersion));
clusterVersionWithProgessingAndFailing.status.conditions.push(conditionProgressing);
clusterVersionWithProgessingAndFailing.status.conditions.push(conditionFailing);

export const clusterVersionWithReleaseAcceptedFalse = JSON.parse(JSON.stringify(clusterVersion));
clusterVersionWithReleaseAcceptedFalse.status.conditions.push(conditionReleaseAcceptedFalse);

export const clusterVersionWithUpgradeableFalse = JSON.parse(
  JSON.stringify(clusterVersionWithAvailableUpdates),
);
clusterVersionWithUpgradeableFalse.status.conditions.push(conditionUpgradableFalse);

export const clusterVersionWithoutChannel = JSON.parse(JSON.stringify(clusterVersion));
clusterVersionWithoutChannel.spec.channel = '';
clusterVersionWithoutChannel.status.conditions.push(conditionUpgradeNoChannel);
