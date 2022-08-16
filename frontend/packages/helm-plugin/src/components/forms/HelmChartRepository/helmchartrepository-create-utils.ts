import * as _ from 'lodash';
import { getGroupVersionKindForReference } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import {
  K8sResourceKindReference,
  kindForReference,
  referenceForModel,
} from '@console/internal/module/k8s';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../../models';
import { HelmChartRepositoryFormData, HelmChartRepositoryType } from '../../../types/helm-types';

export const convertToForm = (resource: HelmChartRepositoryType) => {
  return {
    scope: resource?.kind,
    repoName: resource?.metadata?.name ?? '',
    repoDisplayName: resource?.spec?.name ?? '',
    ca: resource?.spec?.connectionConfig?.ca?.name ?? '',
    disabled: resource?.spec?.disabled ?? false,
    tlsClientConfig: resource?.spec?.connectionConfig?.tlsClientConfig?.name ?? '',
    repoDescription: resource?.spec?.description ?? '',
    repoUrl: resource?.spec?.connectionConfig?.url ?? '',
    metadata: _.omit(resource?.metadata, ['name', 'namespace']) ?? {},
  };
};

export const convertToHelmChartRepository = (
  formValues: HelmChartRepositoryFormData,
  namespace: string,
): HelmChartRepositoryType => {
  const {
    repoName,
    ca,
    disabled,
    tlsClientConfig,
    repoDescription,
    repoUrl,
    metadata,
    scope,
    repoDisplayName,
  } = formValues;

  const newResource: HelmChartRepositoryType = {
    apiVersion:
      scope === 'ProjectHelmChartRepository'
        ? `${ProjectHelmChartRepositoryModel.apiGroup}/${ProjectHelmChartRepositoryModel.apiVersion}`
        : `${HelmChartRepositoryModel.apiGroup}/${HelmChartRepositoryModel.apiVersion}`,
    kind: scope,
    metadata: {
      ...(repoName ? { name: repoName } : { name: '' }),
      ...(scope === 'ProjectHelmChartRepository' ? { namespace } : {}),
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
      ...(repoDisplayName ? { name: repoDisplayName } : {}),
    },
  };

  return newResource;
};

export const getDefaultResource = (
  namespace: string,
  kindRef?: K8sResourceKindReference,
): HelmChartRepositoryType => {
  const newResource: HelmChartRepositoryType = {
    apiVersion: kindRef
      ? `${getGroupVersionKindForReference(kindRef).group}/${
          getGroupVersionKindForReference(kindRef).version
        }`
      : `${ProjectHelmChartRepositoryModel.apiGroup}/${ProjectHelmChartRepositoryModel.apiVersion}`,
    kind: kindRef ? kindForReference(kindRef) : ProjectHelmChartRepositoryModel.kind,
    metadata: {
      name: '',
      ...(kindRef === referenceForModel(ProjectHelmChartRepositoryModel) ? { namespace } : {}),
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
