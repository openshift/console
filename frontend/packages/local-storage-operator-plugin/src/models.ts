import { K8sKind } from '@console/internal/module/k8s';

export const LocalVolumeDiscoveryResult: K8sKind = {
  label: 'Local Volume Discovery Result',
  labelPlural: 'Local Volume Discovery Results',
  apiVersion: 'v1alpha1',
  apiGroup: 'local.storage.openshift.io',
  plural: 'localvolumediscoveryresults',
  abbr: 'LVDR',
  namespaced: true,
  kind: 'LocalVolumeDiscoveryResult',
  id: 'localvolumediscoveryresults',
  crd: true,
};

export const LocalVolumeSetModel: K8sKind = {
  label: 'Local Volume Set',
  labelPlural: 'Local Volume Sets',
  apiVersion: 'v1alpha1',
  apiGroup: 'local.storage.openshift.io',
  plural: 'localvolumesets',
  abbr: 'LVS',
  namespaced: true,
  kind: 'LocalVolumeSet',
  id: 'localvolumeset',
  crd: true,
};

export const LocalVolumeModel: K8sKind = {
  label: 'Local Volume',
  labelPlural: 'Local Volumes',
  apiVersion: 'v1',
  apiGroup: 'local.storage.openshift.io',
  plural: 'localvolumes',
  abbr: 'LV',
  namespaced: true,
  kind: 'LocalVolume',
  id: 'localvolume',
  crd: true,
};
