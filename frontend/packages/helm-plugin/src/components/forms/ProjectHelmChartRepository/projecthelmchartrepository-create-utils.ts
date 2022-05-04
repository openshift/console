import * as _ from 'lodash';
import { ProjectHelmChartRepositoryModel } from '../../../models';
import {
  ProjectHelmChartRepositoryFormData,
  ProjectHelmChartRepositoryType,
} from '../../../types/helm-types';

export const convertToForm = (resource: ProjectHelmChartRepositoryType) => {
  return {
    repoName: resource.metadata?.name ?? '',
    ca: resource.spec?.connectionConfig?.ca?.name ?? '',
    disabled: resource.spec?.disabled ?? false,
    tlsClientConfig: resource.spec?.connectionConfig?.tlsClientConfig?.name ?? '',
    repoDescription: resource.spec?.description ?? '',
    repoUrl: resource.spec?.connectionConfig?.url ?? '',
    metadata: _.omit(resource.metadata, ['name', 'namespace']) ?? {},
  };
};

export const convertToProjectHelmChartRepository = (
  formValues: ProjectHelmChartRepositoryFormData,
  namespace?: string,
): ProjectHelmChartRepositoryType => {
  const {
    repoName,
    ca,
    disabled,
    tlsClientConfig,
    repoDescription,
    repoUrl,
    metadata,
  } = formValues;

  const newResource: ProjectHelmChartRepositoryType = {
    apiVersion: `${ProjectHelmChartRepositoryModel.apiGroup}/${ProjectHelmChartRepositoryModel.apiVersion}`,
    kind: ProjectHelmChartRepositoryModel.kind,
    metadata: {
      ...(repoName ? { name: repoName } : { name: '' }),
      namespace,
      ...metadata,
    },
    spec: {
      connectionConfig: {
        url: repoUrl,
        ...(ca ? { ca: { name: ca } } : {}),
        ...(tlsClientConfig ? { tlsClientConfig: { name: tlsClientConfig } } : {}),
      },
      ...(repoDescription ? { description: repoDescription } : {}),
      ...(disabled ? { disabled } : {}),
      ...(repoName ? { name: repoName } : { name: '' }),
    },
  };

  return newResource;
};

export const getDefaultResource = (namespace: string): ProjectHelmChartRepositoryType => {
  const newResource: ProjectHelmChartRepositoryType = {
    apiVersion: `${ProjectHelmChartRepositoryModel.apiGroup}/${ProjectHelmChartRepositoryModel.apiVersion}`,
    kind: ProjectHelmChartRepositoryModel.kind,
    metadata: {
      name: '',
      namespace,
    },
    spec: {
      connectionConfig: {
        url: '',
      },
      name: '',
    },
  };

  return newResource;
};
