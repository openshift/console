import { K8sModel } from '@console/internal/module/k8s';

export const ConsoleSampleModel: K8sModel = {
  kind: 'ConsoleSample',
  label: 'ConsoleSample',
  labelPlural: 'ConsoleSamples',
  apiGroup: 'console.openshift.io',
  apiVersion: 'v1',
  abbr: 'CS',
  namespaced: false,
  crd: true,
  plural: 'consolesamples',
  propagationPolicy: 'Background',
};
