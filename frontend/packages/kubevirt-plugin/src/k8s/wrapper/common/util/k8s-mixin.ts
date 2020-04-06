import { apiVersionForModel, K8sKind, K8sResourceCommon } from '@console/internal/module/k8s';
import { ensurePath } from '../../utils/utils';
import { omitEmpty } from '../../../../utils/common';

export type K8sInitAddon = {
  name?: string;
  generateName?: string;
  namespace?: string;
  labels?: { [k: string]: string };
  annotations?: { [k: string]: string };
};

export const initK8sObject = (
  base: K8sResourceCommon,
  model: K8sKind,
  { name, generateName, namespace, labels, annotations }: K8sInitAddon = {},
) => {
  if (base && model) {
    base.kind = model.kind;
    base.apiVersion = apiVersionForModel(model);

    ensurePath(base, 'metadata');
    const { metadata } = base;
    if (name) {
      metadata.name = name;
      metadata.generateName = undefined;
    } else if (generateName) {
      metadata.name = undefined;
      metadata.generateName = generateName;
    }
    metadata.namespace = namespace || metadata.namespace;
    metadata.labels = labels || metadata.labels;
    metadata.annotations = annotations || metadata.annotations;
    omitEmpty(metadata, true);
  }
};

export const clearMetadata = (base: K8sResourceCommon) => {
  if (base?.metadata) {
    delete base.metadata;
  }
};

export const clearRuntimeMetadata = (base: K8sResourceCommon) => {
  if (base) {
    delete (base as any).status;
  }
  if (base?.metadata) {
    const { metadata } = base;
    delete metadata.selfLink;
    delete metadata.resourceVersion;
    delete metadata.uid;
    delete metadata.creationTimestamp;
    delete metadata.deletionTimestamp;
    delete metadata.generation;
  }
};
