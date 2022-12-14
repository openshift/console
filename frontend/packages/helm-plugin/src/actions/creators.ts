import { TFunction } from 'i18next';
import { Action, K8sKind } from '@console/dynamic-plugin-sdk';
import { coFetchJSON } from '@console/internal/co-fetch';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { deleteResourceModal } from '@console/shared';
import { ProjectHelmChartRepositoryModel } from '../models';
import { HelmActionsScope } from './types';

export const getHelmDeleteAction = (
  { release: { name: releaseName, namespace }, redirect }: HelmActionsScope,
  t: TFunction,
): Action => ({
  id: 'delete-helm',
  label: t('helm-plugin~Delete Helm Release'),
  cta: () => {
    deleteResourceModal({
      blocking: true,
      resourceName: releaseName,
      resourceType: 'Helm Release',
      actionLabel: t('helm-plugin~Delete'),
      redirect,
      onSubmit: () => {
        return coFetchJSON.delete(
          `/api/helm/release?name=${releaseName}&ns=${namespace}`,
          null,
          null,
          -1,
        );
      },
    });
  },
});

export const getHelmUpgradeAction = (
  { release: { name: releaseName, namespace }, actionOrigin }: HelmActionsScope,
  t: TFunction,
): Action => ({
  id: 'upgrade-helm',
  label: t('helm-plugin~Upgrade'),
  cta: {
    href: `/helm-releases/ns/${namespace}/${releaseName}/upgrade?actionOrigin=${actionOrigin}`,
  },
});

export const getHelmRollbackAction = (
  { release: { name: releaseName, namespace }, actionOrigin }: HelmActionsScope,
  t: TFunction,
): Action => ({
  id: 'rollback-helm',
  label: t('helm-plugin~Rollback'),
  cta: {
    href: `/helm-releases/ns/${namespace}/${releaseName}/rollback?actionOrigin=${actionOrigin}`,
  },
});

export const editChartRepository = (
  model: K8sKind,
  hcr: K8sResourceKind,
  t: TFunction,
): Action => ({
  id: 'edit-chartrepository',
  label: t('helm-plugin~Edit {{label}}', { label: model.kind }),
  cta: {
    href:
      hcr.kind === ProjectHelmChartRepositoryModel.kind
        ? `/ns/${hcr.metadata.namespace}/helmchartrepositories/${
            hcr.metadata.name
          }/edit?kind=${referenceFor(hcr)}`
        : `/k8s/cluster/helmchartrepositories/${hcr.metadata.name}/edit?kind=${referenceFor(hcr)}`,
  },
  accessReview: {
    group: model.apiGroup,
    resource: model.plural,
    name: hcr.metadata.name,
    namespace: hcr.metadata.namespace,
    verb: 'update',
  },
});
