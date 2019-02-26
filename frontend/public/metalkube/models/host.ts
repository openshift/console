// eslint-disable-next-line no-unused-vars
import { K8sKind } from '../../module/k8s';

// TODO: reuse following from kubevirt-web-ui-components to avoid duplicity

export const BaremetalHostModel: K8sKind = {
  label: 'Bare Metal Host',
  labelPlural: 'Bare Metal Hosts',
  apiVersion: 'v1alpha1',
  path: 'baremetalhosts',
  apiGroup: 'metalkube.org',
  plural: 'baremetalhosts',
  abbr: 'BMH',
  namespaced: true,
  kind: 'BareMetalHost',
  id: 'baremetalhost',
};
