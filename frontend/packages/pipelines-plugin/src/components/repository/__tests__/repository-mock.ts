import { RepositoryKind } from '../types';

export const mockRepository: RepositoryKind = {
  apiVersion: 'pipelinesascode.tekton.dev/v1alpha1',
  kind: 'Repository',
  metadata: {
    creationTimestamp: '2021-07-13T09:16:56Z',
    generation: 5,
    name: 'demo-app-pull-request',
    namespace: 'ns1',
    resourceVersion: '171973',
    uid: 'd1ec5cd2-a55b-413c-afae-8b3f25e0723b',
  },
  // eslint-disable-next-line @typescript-eslint/camelcase
  pipelinerun_status: [
    {
      completionTime: '2021-07-13T09:19:30Z',
      conditions: [
        {
          lastTransitionTime: '2021-07-13T09:19:30Z',
          message: 'Tasks Completed: 3 (Failed: 2, Cancelled 0), Skipped: 2',
          reason: 'Failed',
          status: 'False',
          type: 'Succeeded',
        },
      ],
      logurl:
        'https://console-openshift-console.apps.dev-svc-4.8-071307.devcluster.openshift.com/k8s/ns/karthik/tekton.dev~v1beta1~PipelineRun/pipeline-as-code-on-pull-request-8gtxq/logs',
      pipelineRunName: 'pipeline-as-code-on-pull-request-8gtxq',
      sha: '72954b86ee80eb9cf561b109b2fce63e57d10561',
      startTime: '2021-07-13T09:18:09Z',
      title: 'Delete test-1.txt',
    },
    {
      completionTime: '2021-07-13T10:30:08Z',
      conditions: [
        {
          lastTransitionTime: '2021-07-13T10:30:08Z',
          message: 'Tasks Completed: 3 (Failed: 2, Cancelled 0), Skipped: 2',
          reason: 'Failed',
          status: 'False',
          type: 'Succeeded',
        },
      ],
      logurl:
        'https://console-openshift-console.apps.dev-svc-4.8-071307.devcluster.openshift.com/k8s/ns/karthik/tekton.dev~v1beta1~PipelineRun/pipeline-as-code-on-pull-request-j4tjp/logs',
      pipelineRunName: 'pipeline-as-code-on-pull-request-j4tjp',
      sha: 'fa854c0a4821eac3dcc7f862e08396835fec2804',
      startTime: '2021-07-13T10:28:45Z',
      title: 'test push two test push',
    },
    {
      completionTime: '2021-07-13T10:33:51Z',
      conditions: [
        {
          lastTransitionTime: '2021-07-13T10:33:51Z',
          message: 'Tasks Completed: 3 (Failed: 2, Cancelled 0), Skipped: 2',
          reason: 'Failed',
          status: 'False',
          type: 'Succeeded',
        },
      ],
      logurl:
        'https://console-openshift-console.apps.dev-svc-4.8-071307.devcluster.openshift.com/k8s/ns/karthik/tekton.dev~v1beta1~PipelineRun/pipeline-as-code-on-pull-request-n8gph/logs',
      pipelineRunName: 'pipeline-as-code-on-pull-request-n8gph',
      sha: 'dc204e919fc6fd984d24ac6f146b183c1695113d',
      startTime: '2021-07-13T10:33:08Z',
      title: 'Delete test-1.txt',
    },
    {
      completionTime: '2021-07-13T10:45:19Z',
      conditions: [
        {
          lastTransitionTime: '2021-07-13T10:45:19Z',
          message: 'Tasks Completed: 3 (Failed: 2, Cancelled 0), Skipped: 2',
          reason: 'Failed',
          status: 'False',
          type: 'Succeeded',
        },
      ],
      logurl:
        'https://console-openshift-console.apps.dev-svc-4.8-071307.devcluster.openshift.com/k8s/ns/karthik/tekton.dev~v1beta1~PipelineRun/pipeline-as-code-on-pull-request-zpgx7/logs',
      pipelineRunName: 'pipeline-as-code-on-pull-request-zpgx7',
      sha: '9ef2e6554d1846a7b0782c2dcdd8844070ecf242',
      startTime: '2021-07-13T10:44:45Z',
      title: 'Delete test-2.txt',
    },
  ],
  spec: {
    branch: 'main',
    // eslint-disable-next-line @typescript-eslint/camelcase
    event_type: 'pull_request',
    namespace: 'karthik',
    url: 'https://github.com/karthikjeeyar/demo-app',
  },
};
