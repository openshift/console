import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import type { Action, K8sKind } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { coFetchJSON } from '@console/internal/co-fetch';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { LazyDeleteResourceModalOverlay } from '@console/shared';
import { ProjectHelmChartRepositoryModel } from '../models';
import type { HelmActionsScope } from './types';

export const useHelmDeleteAction = (scope: HelmActionsScope, t: TFunction): Action => {
  const launchModal = useOverlay();

  return useMemo(() => {
    if (!scope?.release) {
      return {
        id: 'delete-helm',
        label: t('helm-plugin~Delete Helm Release'),
        cta: () => {},
      };
    }

    const {
      release: { name: releaseName, namespace, version: releaseVersion },
      redirect,
    } = scope;

    return {
      id: 'delete-helm',
      label: t('helm-plugin~Delete Helm Release'),
      cta: () => {
        launchModal(LazyDeleteResourceModalOverlay, {
          resourceName: releaseName,
          resourceType: 'Helm Release',
          actionLabel: t('helm-plugin~Delete'),
          redirect,
          onSubmit: () => {
            return coFetchJSON.delete(
              `/api/helm/release/async?name=${releaseName}&ns=${namespace}&version=${releaseVersion}`,
              null,
              null,
              -1,
            );
          },
        });
      },
    };
  }, [scope, t, launchModal]);
};

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
        ? `/helm-repositories/ns/${hcr.metadata.namespace}/${
            hcr.metadata.name
          }/form?kind=${referenceFor(hcr)}`
        : `/k8s/cluster/helmchartrepositories/${hcr.metadata.name}/form?kind=${referenceFor(hcr)}`,
  },
  accessReview: {
    group: model.apiGroup,
    resource: model.plural,
    name: hcr.metadata.name,
    namespace: hcr.metadata.namespace,
    verb: 'update',
  },
});
