import * as _ from 'lodash';
import { getGroupVersionKindForReference } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import type { K8sResourceKindReference } from '@console/internal/module/k8s';
import { kindForReference, referenceForModel } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../../models/helm';
import type {
  HelmChartRepositoryFormData,
  HelmChartRepositoryType,
} from '../../../types/helm-types';

export const convertToForm = (resource: HelmChartRepositoryType) => ({
  scope: resource?.kind,
  repoName: resource?.metadata?.name ?? '',
  repoDisplayName: resource?.spec?.name ?? '',
  ca: resource?.spec?.connectionConfig?.ca?.name ?? '',
  disabled: resource?.spec?.disabled ?? false,
  tlsClientConfig: resource?.spec?.connectionConfig?.tlsClientConfig?.name ?? '',
  basicAuthConfig: resource?.spec?.connectionConfig?.basicAuthConfig?.name ?? '',
  repoDescription: resource?.spec?.description ?? '',
  repoUrl: resource?.spec?.connectionConfig?.url ?? '',
  metadata: _.omit(resource?.metadata, ['name', 'namespace']) ?? {},
});

export const convertToHelmChartRepository = (
  formValues: HelmChartRepositoryFormData,
  namespace: string,
  existingRepo?: HelmChartRepositoryType,
): HelmChartRepositoryType => {
  const {
    repoName,
    ca,
    disabled,
    tlsClientConfig,
    basicAuthConfig,
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
        ...(basicAuthConfig &&
        (scope === 'ProjectHelmChartRepository' ||
          existingRepo?.kind === 'ProjectHelmChartRepository')
          ? { basicAuthConfig: { name: basicAuthConfig } }
          : {}),
      },
      ...(repoDescription ? { description: repoDescription } : {}),
      ...(disabled ? { disabled } : {}),
      ...(repoDisplayName ? { name: repoDisplayName } : {}),
    },
  };

  return newResource;
};

const HTTPS_PROBE_TIMEOUT_MS = 3000;

export const tryHttpsUpgrade = async (httpUrl: string): Promise<string | null> => {
  if (typeof httpUrl !== 'string' || !httpUrl.startsWith('http://')) {
    return null;
  }
  const httpsUrl = httpUrl.replace(/^http:\/\//, 'https://');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HTTPS_PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(httpsUrl, { method: 'HEAD', signal: controller.signal });
    return response.ok ? httpsUrl : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
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
