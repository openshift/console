import { $ } from 'protractor';

export const ocsOp = $('a[data-test-operator-row="Openshift Container Storage Operator"]');
export const storageClusterView = $(
  'a[href="/k8s/ns/openshift-storage/operators.coreos.com~v1alpha1~ClusterServiceVersion/ocs-operator.v0.0.2/ocs.openshift.io~v1~StorageCluster"]',
);
export const kebabMenu = $('button[data-test-id="kebab-button"]');
export const storageCluster = $('a[data-test-operand-link="ocs-test1storagecluster"]');
export const addCapacityLbl = $('button[data-test-action="Add Capacity"]');
export const addCapacityBtn = $('#confirm-action');
export const storageClusterRow = (uid) => $(`tr[data-id='${uid}']`);
