import { K8sModel } from '@console/dynamic-plugin-sdk';

// /apis/operator.openshift.io/v1/kubecontrollermanagers/cluster'
export const KubeControllerManagerModel: K8sModel = {
  apiVersion: 'v1',
  apiGroup: 'operator.openshift.io',
  label: 'Kube Controller Manager',
  labelPlural: 'Kube Controller Managers',
  plural: 'kubecontrollermanagers',
  kind: 'KubeControllerManager',
  id: 'kubecontrollermanager',
  crd: true,
  abbr: '',
};
