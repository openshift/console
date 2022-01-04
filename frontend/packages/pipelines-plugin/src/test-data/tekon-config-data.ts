import { K8sResourceKind } from 'public/module/k8s';
import { TEKTON_HUB_INTEGRATION_KEY } from '../components/catalog/const';

export enum IntegrationTypes {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  MISSING_INTEGRATION_KEY = 'missing-integration-key',
}

type TekonHubIntegrationConfigs = { [key in IntegrationTypes]?: K8sResourceKind };

const sampleTektonConfig = {
  apiVersion: 'operator.tekton.dev/v1alpha1',
  kind: 'TektonConfig',
  metadata: {
    creationTimestamp: '2022-01-04T05:13:42Z',
    finalizers: ['tektonconfigs.operator.tekton.dev'],
    name: 'config',
    resourceVersion: '97919',
    uid: '3f5045e0-44b5-4a50-8ba8-1e55e9f953d0',
  },
  spec: {
    addon: {
      params: [
        {
          name: 'clusterTasks',
          value: 'true',
        },
        {
          name: 'pipelineTemplates',
          value: 'true',
        },
      ],
    },
    pipeline: {
      'running-in-environment-with-injected-sidecars': true,
      'metrics.taskrun.duration-type': 'histogram',
      'disable-home-env-overwrite': true,
      'metrics.pipelinerun.duration-type': 'histogram',
      params: [
        {
          name: 'enableMetrics',
          value: 'true',
        },
      ],
      'default-service-account': 'pipeline',
      'disable-working-directory-overwrite': true,
      'scope-when-expressions-to-task': false,
      'require-git-ssh-secret-known-hosts': false,
      'enable-tekton-oci-bundles': false,
      'metrics.taskrun.level': 'task',
      'metrics.pipelinerun.level': 'pipeline',
      'enable-api-fields': 'stable',
      'enable-custom-tasks': false,
      'disable-creds-init': false,
      'disable-affinity-assistant': true,
    },
    config: {},
    params: [
      {
        name: 'createRbacResource',
        value: 'true',
      },
    ],
    pruner: {
      keep: 100,
      resources: ['pipelinerun'],
      schedule: '0 8 * * *',
    },
    profile: 'all',
    targetNamespace: 'openshift-pipelines',
    dashboard: {
      readonly: false,
    },
    trigger: {
      'default-service-account': 'pipeline',
      'enable-api-fields': 'stable',
    },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-01-04T05:15:04Z',
        status: 'True',
        type: 'ComponentsReady',
      },
      {
        lastTransitionTime: '2022-01-04T05:15:54Z',
        status: 'True',
        type: 'PostInstall',
      },
      {
        lastTransitionTime: '2022-01-04T05:13:54Z',
        status: 'True',
        type: 'PreInstall',
      },
      {
        lastTransitionTime: '2022-01-04T05:15:54Z',
        status: 'True',
        type: 'Ready',
      },
    ],
    tektonInstallerSets: {
      'rhosp-rbac': 'rbac-resources',
    },
    version: 'v1.6.1',
  },
};

export const tektonHubIntegrationConfigs: TekonHubIntegrationConfigs = {
  [IntegrationTypes.MISSING_INTEGRATION_KEY]: sampleTektonConfig,
  [IntegrationTypes.ENABLED]: {
    ...sampleTektonConfig,
    spec: {
      ...sampleTektonConfig.spec,
      hub: {
        params: [{ name: TEKTON_HUB_INTEGRATION_KEY, value: true }],
      },
    },
  },
  [IntegrationTypes.DISABLED]: {
    ...sampleTektonConfig,
    spec: {
      ...sampleTektonConfig.spec,
      hub: {
        params: [{ name: TEKTON_HUB_INTEGRATION_KEY, value: false }],
      },
    },
  },
};
