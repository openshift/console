import { Taint } from '@console/internal/module/k8s';
import { TFunction } from 'i18next';
import { NetworkType, KMSConfig } from '../components/ocs-install/types';

export const MINIMUM_NODES = 3;
export const ocsTaint: Taint = {
  key: 'node.ocs.openshift.io/storage',
  value: 'true',
  effect: 'NoSchedule',
};
Object.freeze(ocsTaint);

export const storageClassTooltip = (t: TFunction) =>
  t(
    'ceph-storage-plugin~The Storage Class will be used to request storage from the underlying infrastructure to create the backing persistent volumes that will be used to provide the OpenShift Container Storage (OCS) service.',
  );
export const requestedCapacityTooltip = (t: TFunction) =>
  t(
    'ceph-storage-plugin~The backing storage requested will be higher as it will factor in the requested capacity replica factor and fault tolerant costs associated with the requested capacity.',
  );

export enum defaultRequestSize {
  BAREMETAL = '1',
  NON_BAREMETAL = '2Ti',
}

export enum CreateStepsSC {
  DISCOVER = 'DISCOVER',
  STORAGECLASS = 'STORAGECLASS',
  STORAGEANDNODES = 'STORAGEANDNODES',
  CONFIGURE = 'CONFIGURE',
  REVIEWANDCREATE = 'REVIEWANDCREATE',
}

export const diskModeDropdownItems = Object.freeze({
  BLOCK: 'Block',
});

export enum IP_FAMILY {
  IPV4 = 'IPV4',
  IPV6 = 'IPV6',
}

export const NetworkTypeLabels = {
  [NetworkType.DEFAULT]: 'Default (SDN)',
  [NetworkType.MULTUS]: 'Custom (Multus)',
};
export const KMSProviders = [
  {
    name: 'Vault',
    value: 'vault',
  },
];

export const KMSMaxFileUploadSize = 4000000;
export const KMSConfigMapName = 'ocs-kms-connection-details';
export const KMSConfigMapCSIName = 'csi-kms-connection-details';
export const KMSSecretName = 'ocs-kms-token';

export const KMSEmptyState: KMSConfig = Object.freeze({
  name: {
    value: '',
    valid: true,
  },
  token: {
    value: '',
    valid: true,
  },
  address: {
    value: '',
    valid: true,
  },
  port: {
    value: '',
    valid: true,
  },
  backend: '',
  caCert: null,
  tls: '',
  clientCert: null,
  clientKey: null,
  providerNamespace: '',
  hasHandled: true,
  caCertFile: '',
  clientCertFile: '',
  clientKeyFile: '',
});
