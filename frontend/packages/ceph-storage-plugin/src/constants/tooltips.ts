import { TFunction } from 'i18next';

export const storageClassTooltip = (t: TFunction) =>
  t(
    'ceph-storage-plugin~The infrastructure storage class used by OpenShift Container Storage to write its data and metadata.',
  );
export const attachedDevicesStorageClassTooltip = (t: TFunction) =>
  t(
    'ceph-storage-plugin~Infrastructure storage class created by Local Storage Operator and used by OpenShift Container Storage to write its data and metadata.',
  );
export const requestedCapacityTooltip = (t: TFunction) =>
  t(
    'ceph-storage-plugin~The amount of capacity that would be dynamically allocated on the infrastructure storage class.',
  );
export const arbiterText = (t: TFunction) =>
  t(
    'ceph-storage-plugin~If you wish to use the Arbiter stretch cluster, a minimum of 4 nodes (2 different zones, 2 nodes per zone) and 1 additional zone with 1 node is required. All nodes must be pre-labeled with zones in order to be validated on cluster creation.',
  );
export const attachDevices = (t: TFunction) =>
  t(
    'ceph-storage-plugin~Selected nodes are based on the selected storage class. The selected nodes will preferably be in 3 different zones with a recommended requirement of 14 CPUs and 34 GiB per node.',
  );
export const attachDevicesWithArbiter = (t: TFunction) =>
  t(
    'ceph-storage-plugin~Selected nodes are based on the selected storage class. 4 nodes in 2 different zones will be selected with a recommended requirement of 14 CPU and 34 GiB RAM per node.',
  );
export const encryptionTooltip =
  'The storage cluster encryption level can be set to include all components under the cluster (including storage class and PVs) or to include only storage class encryption. PV encryption can use an auth token that will be used with the KMS configuration to allow multi-tenancy.';
export const vaultNamespaceTooltip =
  'Vault enterprise namespaces are isolated environments that functionally exist as "Vaults within a Vault". They have separate login paths and support creating and managing data isolated to their namespace.';
