export const clusterVersionWithUpdate = {
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: {
    creationTimestamp: '2024-01-04T05:14:57Z',
    generation: 4,
    managedFields: [
      {
        apiVersion: 'config.openshift.io/v1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:spec': {
            '.': {},
            'f:clusterID': {},
          },
        },
        manager: 'cluster-bootstrap',
        operation: 'Update',
        time: '2024-01-04T05:14:57Z',
      },
      {
        apiVersion: 'config.openshift.io/v1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:spec': {
            'f:upstream': {},
          },
        },
        manager: 'oc',
        operation: 'Update',
        time: '2024-01-04T05:37:09Z',
      },
      {
        apiVersion: 'config.openshift.io/v1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:spec': {
            'f:channel': {},
          },
        },
        manager: 'Mozilla',
        operation: 'Update',
        time: '2024-01-04T13:58:00Z',
      },
      {
        apiVersion: 'config.openshift.io/v1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:status': {
            '.': {},
            'f:availableUpdates': {},
            'f:capabilities': {
              '.': {},
              'f:enabledCapabilities': {},
              'f:knownCapabilities': {},
            },
            'f:conditions': {
              '.': {},
              'k:{"type":"Available"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:message': {},
                'f:status': {},
                'f:type': {},
              },
              'k:{"type":"Failing"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:status': {},
                'f:type': {},
              },
              'k:{"type":"ImplicitlyEnabledCapabilities"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:message': {},
                'f:reason': {},
                'f:status': {},
                'f:type': {},
              },
              'k:{"type":"Progressing"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:message': {},
                'f:status': {},
                'f:type': {},
              },
              'k:{"type":"ReleaseAccepted"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:message': {},
                'f:reason': {},
                'f:status': {},
                'f:type': {},
              },
              'k:{"type":"RetrievedUpdates"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:status': {},
                'f:type': {},
              },
              'k:{"type":"Upgradeable"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:message': {},
                'f:reason': {},
                'f:status': {},
                'f:type': {},
              },
            },
            'f:desired': {
              '.': {},
              'f:image': {},
              'f:version': {},
            },
            'f:history': {},
            'f:observedGeneration': {},
            'f:versionHash': {},
          },
        },
        manager: 'cluster-version-operator',
        operation: 'Update',
        subresource: 'status',
        time: '2024-01-04T13:58:01Z',
      },
    ],
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
    availableUpdates: [
      {
        image:
          'registry.ci.openshift.org/ocp/release@sha256:f31d5b0e23c8f978b57f5ef74c8811e7f87103187aa1895880f67eac4eb76f6d',
        version: '4.16.0-0.nightly-2024-01-04-011543',
      },
    ],
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
          'Payload loaded version="4.16.0-0.nightly-2024-01-03-193825" image="registry.ci.openshift.org/ocp/release@sha256:ff486203f5b065836105fcd56f29467229bfc6258e5d8ba7f479ac575d81c721" architecture="amd64"',
        reason: 'PayloadLoaded',
        status: 'True',
        type: 'ReleaseAccepted',
      },
      {
        lastTransitionTime: '2024-01-04T05:35:14Z',
        message: 'Done applying 4.16.0-0.nightly-2024-01-03-193825',
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
        message: 'Cluster version is 4.16.0-0.nightly-2024-01-03-193825',
        status: 'False',
        type: 'Progressing',
      },
      {
        lastTransitionTime: '2024-01-04T05:45:29Z',
        message:
          'Cluster operator operator-lifecycle-manager should not be upgraded between minor versions: ClusterServiceVersions blocking cluster upgrade: openshift-operators/openshift-pipelines-operator-rh.v1.12.2 is incompatible with OpenShift minor versions greater than 4.14',
        reason: 'IncompatibleOperatorsInstalled',
        status: 'False',
        type: 'Upgradeable',
      },
    ],
    desired: {
      image:
        'registry.ci.openshift.org/ocp/release@sha256:ff486203f5b065836105fcd56f29467229bfc6258e5d8ba7f479ac575d81c721',
      version: '4.16.0-0.nightly-2024-01-03-193825',
    },
    history: [
      {
        completionTime: '2024-01-04T05:35:14Z',
        image:
          'registry.ci.openshift.org/ocp/release@sha256:ff486203f5b065836105fcd56f29467229bfc6258e5d8ba7f479ac575d81c721',
        startedTime: '2024-01-04T05:15:00Z',
        state: 'Completed',
        verified: false,
        version: '4.16.0-0.nightly-2024-01-03-193825',
      },
    ],
    observedGeneration: 3,
    versionHash: 'rqBs61ZyVwQ=',
  },
};
