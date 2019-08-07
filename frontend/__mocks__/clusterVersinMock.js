export const clusterVersionProps = {
    apiVersion: 'config.openshift.io/v1',
    kind: 'ClusterVersion',
    metadata: {
      creationTimestamp: '2019-07-29T09:03:51Z',
      generation: 1,
      name: 'version',
      resourceVersion: '507643',
      selfLink: '/apis/config.openshift.io/v1/clusterversions/version',
      uid: 'c8ea96fb-b1df-11e9-96e9-0234dade93dc'
    },
    spec: {
      channel: 'stable-4.2',
      clusterID: '342d8338-c08f-44ae-a82e-a032a4481fa9',
      upstream: 'https://api.openshift.com/api/upgrades_info/v1/graph',
      desiredUpdate: { image: 'string', version: 'string' }
    },
    status: {
      availableUpdates: null,
      conditions: [
        {
          lastTransitionTime: '2019-07-29T09:20:13Z',
          message: 'Done applying 4.2.0-0.ci-2019-07-22-025130',
          status: 'True',
          type: 'Available'
        },
        {
          lastTransitionTime: '2019-07-30T04:18:13Z',
          message: 'Cluster operator monitoring is reporting a failure: Failed to rollout the stack. Error: running task Updating prometheus-adapter failed: reconciling PrometheusAdapter Deployment failed: updating deployment object failed: waiting for DeploymentRollout of prometheus-adapter: deployment prometheus-adapter is not ready. status: (replicas: 3, updated: 1, ready: 2, unavailable: 1)',
          reason: 'ClusterOperatorDegraded',
          status: 'True',
          type: 'Failing'
        },
        {
          lastTransitionTime: '2019-07-29T09:20:13Z',
          message: 'Error while reconciling 4.2.0-0.ci-2019-07-22-025130: the cluster operator monitoring is degraded',
          reason: 'ClusterOperatorDegraded',
          status: 'False',
          type: 'Progressing'
        },
        {
          lastTransitionTime: '2019-07-29T09:04:05Z',
          message: 'Unable to retrieve available updates: currently installed version 4.2.0-0.ci-2019-07-22-025130 not found in the "stable-4.2" channel',
          reason: 'RemoteFailed',
          status: 'False',
          type: 'RetrievedUpdates'
        }
      ],
      desired: {
        force: false,
        image: 'registry.svc.ci.openshift.org/ocp/release@sha256:12da30aa8d94d8d4d4db3f8c88a30b6bdaf847bc714b2a551a2637a89c36f3c1',
        version: '4.2.0-0.ci-2019-07-22-025130'
      },
      history: [
        {
          completionTime: '2019-07-29T09:20:13Z',
          image: 'registry.svc.ci.openshift.org/ocp/release@sha256:12da30aa8d94d8d4d4db3f8c88a30b6bdaf847bc714b2a551a2637a89c36f3c1',
          startedTime: '2019-07-29T09:04:05Z',
          state: 'Completed',
          verified: false,
          version: '4.2.0-0.ci-2019-07-22-025130'
        }
      ],
      observedGeneration: 1,
      versionHash: 'ziIO4wtCdsg='
    }
  }