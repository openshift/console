import { TektonHub } from '../types/hub';

export const sampleTektonHubCR: TektonHub = {
  apiVersion: 'operator.tekton.dev/v1alpha1',
  kind: 'TektonHub',
  metadata: {
    creationTimestamp: '2022-04-14T09:56:29Z',
    name: 'hub',
    resourceVersion: '91182',
    uid: '247a09d7-3de3-4e21-92ec-238b99d97c2b',
  },
  spec: {
    api: {
      hubConfigUrl: 'https://raw.githubusercontent.com/karthikjeeyar/hub/main/config.yaml',
      secret: 'tekton-hub-api',
    },
    db: {
      secret: 'tekton-hub-db',
    },
    targetNamespace: 'karthik',
  },
  status: {
    apiUrl: 'https://tekton-hub-api.devcluster.openshift.com',
    authUrl: 'https://tekton-hub-auth.devcluster.openshift.com',
    conditions: [
      {
        lastTransitionTime: '2022-04-14T10:00:00Z',
        status: 'True',
        type: 'ApiDependenciesInstalled',
      },
      {
        lastTransitionTime: '2022-04-14T09:59:45Z',
        status: 'True',
        type: 'ApiInstallSetAvailable',
      },
      {
        lastTransitionTime: '2022-04-14T09:59:04Z',
        status: 'True',
        type: 'DatabasebMigrationDone',
      },
      {
        lastTransitionTime: '2022-04-14T09:57:52Z',
        status: 'True',
        type: 'DbDependenciesInstalled',
      },
      {
        lastTransitionTime: '2022-04-14T09:58:43Z',
        status: 'True',
        type: 'DbInstallSetAvailable',
      },
      {
        lastTransitionTime: '2022-04-14T10:00:00Z',
        status: 'True',
        type: 'PostReconciler',
      },
      {
        lastTransitionTime: '2022-04-14T09:57:52Z',
        status: 'True',
        type: 'PreReconciler',
      },
      {
        lastTransitionTime: '2022-04-14T10:00:00Z',
        status: 'True',
        type: 'Ready',
      },
      {
        lastTransitionTime: '2022-04-14T09:59:45Z',
        status: 'True',
        type: 'UiDependenciesInstalled',
      },
      {
        lastTransitionTime: '2022-04-14T10:00:00Z',
        status: 'True',
        type: 'UiInstallSetAvailable',
      },
    ],
    hubInstallerSets: {
      ApiInstallerSet: 'tekton-hub-api-w6m9z',
      DbInstallerSet: 'tekton-hub-db-8mzw8',
      DbMigrationInstallerSet: 'tekton-hub-db-migration-zkn9p',
      UiInstallerSet: 'tekton-hub-ui-fjbbb',
    },
    observedGeneration: 1,
    uiUrl: 'https://tekton-hub-ui.devcluster.openshift.com',
    version: 'v1.7.1',
  },
};
