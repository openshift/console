import { K8sKind } from '@console/internal/module/k8s';

export const ImageManifestVulnModel: K8sKind = {
  kind: 'ImageManifestVuln',
  label: 'ImageManifestVuln',
  labelPlural: 'ImageManifestVuln',
  apiGroup: 'secscan.quay.redhat.com',
  apiVersion: 'v1alpha1',
  abbr: 'IMV',
  namespaced: true,
  crd: true,
  plural: 'imagemanifestvulns',
};
