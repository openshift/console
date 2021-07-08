import { VolumeTypes } from '../components/pipelines/const';
import { AddTriggerFormValues } from '../components/pipelines/modals/triggers/types';

export const formValues: AddTriggerFormValues = {
  namespace: 'test-ns',
  parameters: [
    {
      default: 'test-node',
      name: 'APP_NAME',
      type: 'string',
    },
    {
      default: 'https://github.com/karthikjeeyar/nodejs-ex',
      name: 'GIT_REPO',
      type: 'string',
    },
    {
      default: 'master',
      name: 'GIT_REVISION',
      type: 'string',
    },
    {
      default: 'image-registry.openshift-image-registry.svc:5000/karthik/test-node',
      name: 'APP_NAME',
      type: 'string',
    },
    {
      default: '.',
      name: 'PATH_CONTEXT',
      type: 'string',
    },
    {
      default: '12',
      name: 'MAJOR_VERSION',
      type: 'string',
    },
  ],
  resources: [],
  workspaces: [
    {
      name: 'workspace',
      type: VolumeTypes.PVC,
      data: {
        persistentVolumeClaim: {
          claimName: 'pvc-c9a548597b',
        },
      },
    },
  ],
  triggerBinding: {
    name: '2~github-push',
    resource: {
      kind: 'ClusterTriggerBinding',
      apiVersion: 'triggers.tekton.dev/v1alpha1',
      metadata: {
        name: 'github-push',
      },
      spec: {
        params: [
          {
            name: 'git-revision',
            value: '$(body.head_commit.id)',
          },
          {
            name: 'git-commit-message',
            value: '$(body.head_commit.message)',
          },
          {
            name: 'git-repo-url',
            value: '$(body.repository.url)',
          },
          {
            name: 'git-repo-name',
            value: '$(body.repository.name)',
          },
          {
            name: 'content-type',
            value: '$(header.Content-Type)',
          },
          {
            name: 'pusher-name',
            value: '$(body.pusher.name)',
          },
        ],
      },
    },
  },
};
