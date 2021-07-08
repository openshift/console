import * as React from 'react';
import { TFunction } from 'i18next';
import { Trans } from 'react-i18next';

export const storageClassTooltip = (t: TFunction) =>
  t(
    'ceph-storage-plugin~The infrastructure StorageClass used by OpenShift Container Storage to write its data and metadata.',
  );
export const attachedDevicesStorageClassTooltip = (t: TFunction) =>
  t(
    'ceph-storage-plugin~Infrastructure StorageClass created by Local Storage Operator and used by OpenShift Container Storage to write its data and metadata.',
  );
export const requestedCapacityTooltip = (t: TFunction) =>
  t(
    'ceph-storage-plugin~The amount of capacity that would be dynamically allocated on the infrastructure StorageClass.',
  );
export const arbiterText = (t: TFunction) =>
  t(
    'ceph-storage-plugin~If you wish to use the Arbiter stretch cluster, a minimum of 4 nodes (2 different zones, 2 nodes per zone) and 1 additional zone with 1 node is required. All nodes must be pre-labeled with zones in order to be validated on cluster creation.',
  );
export const encryptionTooltip =
  'The StorageCluster encryption level can be set to include all components under the cluster (including StorageClass and PVs) or to include only StorageClass encryption. PV encryption can use an auth token that will be used with the KMS configuration to allow multi-tenancy.';
export const vaultNamespaceTooltip =
  'Vault enterprise namespaces are isolated environments that functionally exist as "Vaults within a Vault". They have separate login paths and support creating and managing data isolated to their namespace.';
export const attachDevices = (t: TFunction, scName: string) => {
  return (
    <Trans t={t} ns="ceph-storage-plugin">
      Selected nodes are based on the StorageClass <em>{{ scName }}</em> and with a recommended
      requirement of 14 CPU and 34 GiB RAM per node.
    </Trans>
  );
};
export const attachDevicesWithArbiter = (t: TFunction, scName: string) => {
  return (
    <Trans t={t} ns="ceph-storage-plugin">
      Selected nodes are based on the StorageClass <em>{{ scName }}</em> and fulfill the stretch
      cluster requirements with a recommended requirement of 14 CPU and 34 GiB RAM per node.
    </Trans>
  );
};
