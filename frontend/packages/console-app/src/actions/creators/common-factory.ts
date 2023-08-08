import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import {
  annotationsModalLauncher,
  deleteModal,
  labelsModalLauncher,
  configureReplicaCountModal,
  podSelectorModal,
  tolerationsModal,
} from '@console/internal/components/modals';
import { resourceObjPath, asAccessReview } from '@console/internal/components/utils';
import { referenceForModel, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

export type ResourceActionCreator = (
  kind: K8sKind,
  obj: K8sResourceKind,
  relatedResource?: K8sResourceKind,
  message?: JSX.Element,
) => Action;

export type ResourceActionFactory = { [name: string]: ResourceActionCreator };

export const CommonActionFactory: ResourceActionFactory = {
  Delete: (
    kind: K8sKind,
    obj: K8sResourceKind,
    relatedResource?: K8sResourceKind,
    message?: JSX.Element,
  ): Action => ({
    id: `delete-resource`,
    label: i18next.t('console-app~Delete {{kind}}', { kind: kind.kind }),
    cta: () =>
      deleteModal({
        kind,
        resource: obj,
        message,
      }),
    accessReview: asAccessReview(kind, obj, 'delete'),
  }),
  Edit: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: `edit-resource`,
    label: i18next.t('console-app~Edit {{kind}}', { kind: kind.kind }),
    cta: {
      href: `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/yaml`,
    },
    // TODO: Fallback to "View YAML"? We might want a similar fallback for annotations, labels, etc.
    accessReview: asAccessReview(kind, obj, 'update'),
  }),
  ModifyLabels: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'edit-labels',
    label: i18next.t('console-app~Edit labels'),
    cta: () =>
      labelsModalLauncher({
        kind,
        resource: obj,
        blocking: true,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyAnnotations: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'edit-annotations',
    label: i18next.t('console-app~Edit annotations'),
    cta: () =>
      annotationsModalLauncher({
        kind,
        resource: obj,
        blocking: true,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyCount: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'edit-pod-count',
    label: i18next.t('console-app~Edit Pod count'),
    cta: () =>
      configureReplicaCountModal({
        resourceKind: kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'patch', 'scale'),
  }),
  ModifyPodSelector: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'edit-pod-selector',
    label: i18next.t('console-app~Edit Pod selector'),
    cta: () =>
      podSelectorModal({
        kind,
        resource: obj,
        blocking: true,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyTolerations: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'edit-toleration',
    label: i18next.t('console-app~Edit tolerations'),
    cta: () =>
      tolerationsModal({
        resourceKind: kind,
        resource: obj,
        modalClassName: 'modal-lg',
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  AddStorage: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'add-storage',
    label: i18next.t('console-app~Add storage'),
    cta: {
      href: `${resourceObjPath(
        obj,
        kind.crd ? referenceForModel(kind) : kind.kind,
      )}/attach-storage`,
    },
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
};

export const getCommonResourceActions = (
  kind: K8sKind,
  obj: K8sResourceKind,
  message?: JSX.Element,
): Action[] => {
  return [
    CommonActionFactory.ModifyLabels(kind, obj),
    CommonActionFactory.ModifyAnnotations(kind, obj),
    CommonActionFactory.Edit(kind, obj),
    CommonActionFactory.Delete(kind, obj, undefined, message),
  ];
};
