import {
  ProjectHelmChartRepositoryFormData,
  ProjectHelmChartRepositoryType,
} from '../../../../types/helm-types';

export const sampleProjectHelmChartRepository: ProjectHelmChartRepositoryType = {
  apiVersion: 'helm.openshift.io/v1beta1',
  kind: 'ProjectHelmChartRepository',
  metadata: {
    name: 'phcr',
    namespace: 'test-ns',
    labels: {
      app: 'test-app',
    },
    annotations: {
      'helm.openshift.io/description': 'test-description',
    },
  },
  spec: {
    connectionConfig: {
      url: 'https://github.com/helm/examples/tree/main/charts/hello-world',
      ca: {
        name: 'test-ca',
      },
      tlsClientConfig: {
        name: 'test-tlsClientConfig',
      },
    },
    description: 'test-description',
    disabled: false,
    name: 'phcr',
  },
};

export const sampleProjectHelmChartRepositoryFormData: ProjectHelmChartRepositoryFormData = {
  repoName: 'phcr',
  ca: 'test-ca',
  disabled: false,
  tlsClientConfig: 'test-tlsClientConfig',
  repoDescription: 'test-description',
  repoUrl: 'https://github.com/helm/examples/tree/main/charts/hello-world',
  metadata: {
    labels: {
      app: 'test-app',
    },
    annotations: {
      'helm.openshift.io/description': 'test-description',
    },
  },
};

export const defaultProjectHelmChartRepository: ProjectHelmChartRepositoryType = {
  apiVersion: 'helm.openshift.io/v1beta1',
  kind: 'ProjectHelmChartRepository',
  metadata: {
    name: '',
    namespace: 'test-ns',
  },
  spec: {
    connectionConfig: {
      url: '',
    },
    name: '',
  },
};
