import * as _ from 'lodash';
import { modelFor, referenceForGroupVersionKind } from '@console/internal/module/k8s';
import { K8sKind } from '@console/internal/module/k8s/types';

const VERSIONS = ['v1', 'v1alpha3', 'v1beta1', 'v1alpha1'];

export const getKubevirtModelAvailableVersion = (model: K8sKind): string =>
  _.uniq([model.apiVersion, ...VERSIONS]).find(
    (v) => !!modelFor(referenceForGroupVersionKind(model.apiGroup)(v)(model.kind)),
  );

export const kubevirtReferenceForModel = (model: K8sKind): string => {
  const version = getKubevirtModelAvailableVersion(model);

  if (version) {
    return referenceForGroupVersionKind(model.apiGroup)(version)(model.kind);
  }

  return model.kind;
};

export const getKubevirtAvailableModel = (model: K8sKind): K8sKind => {
  const version = getKubevirtModelAvailableVersion(model);

  if (version) {
    return modelFor(referenceForGroupVersionKind(model.apiGroup)(version)(model.kind));
  }

  return model;
};

export const getKubevirtModelAvailableAPIVersion = (model: K8sKind): string =>
  `${model.apiGroup}/${getKubevirtModelAvailableVersion(model) || model.apiVersion}`;
