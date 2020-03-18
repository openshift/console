import { K8sKind } from '@console/internal/module/k8s';

export const LocalVolumeGroupModel: K8sKind = {
  label: 'Local Volume Group',
  labelPlural: 'Local Volume Groups',
  apiVersion: 'v1alpha1',
  apiGroup: 'local.storage.openshift.io',
  plural: 'localvolumegroups',
  abbr: 'LVG',
  namespaced: true,
  kind: 'LocalVolumeGroup',
  id: 'localvolumegroup',
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
