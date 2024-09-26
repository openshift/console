import {
  apiVersionForModel,
  K8sKind,
  modelForGroupKind,
  referenceForModel,
} from '@console/internal/module/k8s';

export const getKubevirtModelAvailableVersion = (model: K8sKind): string =>
  modelForGroupKind(model.apiGroup, model.kind)?.apiVersion || model.apiVersion;

export const kubevirtReferenceForModel = (model: K8sKind): string =>
  referenceForModel(modelForGroupKind(model.apiGroup, model.kind) || model);

export const getKubevirtAvailableModel = (model: K8sKind): K8sKind =>
  modelForGroupKind(model.apiGroup, model.kind) || model;

export const getKubevirtModelAvailableAPIVersion = (model: K8sKind): string =>
  apiVersionForModel(modelForGroupKind(model.apiGroup, model.kind) || model);
