import { K8sKind } from '@console/internal/module/k8s';

export const ServiceBindingRequestModel: K8sKind = {
  id: 'servicebindingrequest',
  kind: 'ServiceBindingRequest',
  plural: 'servicebindingrequests',
  label: 'ServiceBindingRequest',
  labelPlural: 'ServiceBindingRequests',
  abbr: 'SBR',
  apiGroup: 'apps.openshift.io',
  apiVersion: 'v1alpha1',
  namespaced: true,
  crd: true,
};
