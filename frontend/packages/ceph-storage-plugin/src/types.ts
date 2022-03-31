import { IRow } from '@patternfly/react-table';
import {
  K8sResourceKind,
  K8sResourceCommon,
  NodeKind,
  SecretKind,
  StorageClassResourceKind,
} from '@console/internal/module/k8s';
import { TableProps } from '@console/internal/components/factory';

import { DiskMetadata } from 'packages/local-storage-operator-plugin/src/components/disks-list/types';
import {
  PROVIDERS_NOOBAA_MAP,
  NOOBAA_TYPE_MAP,
  NS_PROVIDERS_NOOBAA_MAP,
  NS_NOOBAA_TYPE_MAP,
} from './constants/providers';
import { NamespacePolicyType } from './constants/bucket-class';

export type SpecProvider = typeof PROVIDERS_NOOBAA_MAP[keyof typeof PROVIDERS_NOOBAA_MAP];
export type SpecType = typeof NOOBAA_TYPE_MAP[keyof typeof NOOBAA_TYPE_MAP];

export type nsSpecProvider = typeof NS_PROVIDERS_NOOBAA_MAP[keyof typeof NS_PROVIDERS_NOOBAA_MAP];
export type nsSpecType = typeof NS_NOOBAA_TYPE_MAP[keyof typeof NS_NOOBAA_TYPE_MAP];

export enum PlacementPolicy {
  Spread = 'Spread',
  Mirror = 'Mirror',
}

export type K8sListResponse<T> = {
  items: T[];
};

export type BackingStoreKind = K8sResourceCommon & {
  spec: {
    [key in SpecProvider]: {
      [key: string]: string;
    };
  } & {
    type: SpecType;
  };
};

export type NamespaceStoreKind = K8sResourceCommon & {
  spec: {
    [key in nsSpecProvider]: {
      [key: string]: string;
    };
  } & {
    type: nsSpecType;
  };
};

export type BucketClassKind = K8sResourceCommon & {
  spec: {
    placementPolicy: {
      tiers: {
        backingStores: string[];
        placement: PlacementPolicy;
      }[];
    };
    namespacePolicy: {
      type: NamespacePolicyType;
      single: {
        resource: string;
      };
      multi: {
        writeResource: string;
        readResources: string[];
      };
      cache: {
        caching: {
          ttl: number;
        };
        hubResource: string;
      };
    };
  };
};

type NodeTableRow = {
  cells: IRow['cells'];
  props: {
    id: string;
  };
  selected?: boolean;
};

export type GetRows = (
  {
    componentProps,
    customData,
  }: {
    componentProps: { data: NodeKind[] };
    customData?: {
      onRowSelected?: (nodes: NodeKind[]) => void;
      nodes?: NodeKind[];
      filteredNodes?: string[];
      setNodes?: (nodes: NodeKind[]) => void;
    };
  },
  visibleRows?: Set<string>,
  setVisibleRows?: React.Dispatch<React.SetStateAction<Set<string>>>,
  selectedNodes?: Set<string>,
  setSelectedNodes?: (nodes: NodeKind[]) => void,
) => NodeTableRow[];

export type NodeTableProps = TableProps & {
  data: NodeKind[];
  customData?: {
    onRowSelected?: (nodes: NodeKind[]) => void;
    nodes?: NodeKind[];
    filteredNodes?: string[];
    setNodes?: (nodes: NodeKind[]) => void;
  };
  filters: { name: string; label: { all: string[] } };
};

export type EncryptionType = {
  clusterWide: boolean;
  storageClass: boolean;
  advanced: boolean;
  hasHandled: boolean;
};

export type VaultConfig = {
  name: {
    value: string;
    valid: boolean;
  };
  address: {
    value: string;
    valid: boolean;
  };
  port: {
    value: string;
    valid: boolean;
  };
  authValue?: {
    value: string;
    valid: boolean;
  };
  authMethod: VaultAuthMethods;
  backend: string;
  caCert: SecretKind;
  caCertFile: string;
  tls: string;
  clientCert: SecretKind;
  clientCertFile: string;
  clientKey: SecretKind;
  clientKeyFile: string;
  providerNamespace: string;
  providerAuthNamespace: string;
  providerAuthPath: string;
  hasHandled: boolean;
};

export type HpcsConfig = {
  name: {
    value: string;
    valid: boolean;
  };
  instanceId: {
    value: string;
    valid: boolean;
  };
  apiKey: {
    value: string;
    valid: boolean;
  };
  rootKey: {
    value: string;
    valid: boolean;
  };
  baseUrl: {
    value: string;
    valid: boolean;
  };
  tokenUrl: string;
  hasHandled: boolean;
};

export enum HPCSParams {
  NAME = 'name',
  INSTANCE_ID = 'instanceId',
  API_KEY = 'apiKey',
  ROOT_KEY = 'rootKey',
  BASE_URL = 'baseUrl',
  TOKEN_URL = 'tokenUrl',
}

export enum ProviderNames {
  VAULT = 'vault',
  HPCS = 'hpcs',
}

export enum VaultAuthMethods {
  TOKEN = 'token',
  KUBERNETES = 'kubernetes',
}

export enum KmsEncryptionLevel {
  CLUSTER_WIDE = 'cluster_wide',
  STORAGE_CLASS = 'storage_class',
}

export enum KmsImplementations {
  VAULT = 'vault', // used by rook for token-based vault, also used by ceph-csi for service account of same namespace
  VAULT_TOKENS = 'vaulttokens', // used by ceph-csi for token-based vault
  VAULT_TENANT_SA = 'vaulttenantsa', // used by ceph-csi for tenant service account
  IBM_KEY_PROTECT = 'ibmkeyprotect', // used by both rook & ceph-csi
}

export enum KmsCsiConfigKeysMapping {
  KMS_PROVIDER = 'encryptionKMSType',

  // vault
  VAULT_ADDR = 'vaultAddress',
  VAULT_BACKEND_PATH = 'vaultBackendPath',
  VAULT_CACERT = 'vaultCAFromSecret',
  VAULT_TLS_SERVER_NAME = 'vaultTLSServerName',
  VAULT_CLIENT_CERT = 'vaultClientCertFromSecret',
  VAULT_CLIENT_KEY = 'vaultClientCertKeyFromSecret',
  VAULT_NAMESPACE = 'vaultNamespace',
  VAULT_TOKEN_NAME = 'tenantTokenName',
  VAULT_AUTH_KUBERNETES_ROLE = 'vaultRole',
  VAULT_AUTH_PATH = 'vaultAuthPath',
  VAULT_AUTH_NAMESPACE = 'vaultAuthNamespace',
  VAULT_AUTH_METHOD = 'vaultAuthMethod',
  VAULT_CACERT_FILE = 'vaultCAFileName',
  VAULT_CLIENT_KEY_FILE = 'vaultClientCertKeyFileName',
  VAULT_CLIENT_CERT_FILE = 'vaultClientCertFileName',

  // ibm hpcs
  IBM_KP_SERVICE_INSTANCE_ID = 'ibmKPServiceInstanceID',
  IBM_KP_SECRET_NAME = 'ibmKPKMSKey',
  IBM_KP_BASE_URL = 'ibmKPBaseURL',
  IBM_KP_TOKEN_URL = 'ibmKPTokenURL',

  // ui specific
  KMS_SERVICE_NAME = 'kmsServiceName',
}

export const VaultAuthMethodMapping: {
  [keys in VaultAuthMethods]: {
    name: string;
    value: VaultAuthMethods;
    supportedEncryptionType: KmsEncryptionLevel[];
  };
} = {
  [VaultAuthMethods.KUBERNETES]: {
    name: 'Kubernetes',
    value: VaultAuthMethods.KUBERNETES,
    supportedEncryptionType: [KmsEncryptionLevel.CLUSTER_WIDE],
  },
  [VaultAuthMethods.TOKEN]: {
    name: 'Token',
    value: VaultAuthMethods.TOKEN,
    supportedEncryptionType: [KmsEncryptionLevel.CLUSTER_WIDE, KmsEncryptionLevel.STORAGE_CLASS],
  },
};

export type KMSConfig = {
  [ProviderNames.VAULT]: VaultConfig;
  [ProviderNames.HPCS]: HpcsConfig;
  provider: ProviderNames;
};

export enum NetworkType {
  DEFAULT = 'DEFAULT',
  MULTUS = 'MULTUS',
}

export enum NADSelectorType {
  CLUSTER = 'CLUSTER',
  PUBLIC = 'PUBLIC',
}

export type VaultCommonConfigMap = {
  KMS_PROVIDER: string;
  KMS_SERVICE_NAME: string;
  VAULT_ADDR: string; // address + port
  VAULT_BACKEND_PATH: string;
  VAULT_CACERT?: string;
  VAULT_CACERT_FILE?: string;
  VAULT_TLS_SERVER_NAME?: string;
  VAULT_CLIENT_CERT?: string;
  VAULT_CLIENT_CERT_FILE?: string;
  VAULT_CLIENT_KEY?: string;
  VAULT_CLIENT_KEY_FILE?: string;
  VAULT_AUTH_METHOD?: string;
};

export type VaultTokenConfigMap = {
  VAULT_TOKEN_NAME: string;
  VAULT_NAMESPACE?: string;
} & VaultCommonConfigMap;

export type VaultSAConfigMap = {
  VAULT_AUTH_KUBERNETES_ROLE?: string;
  VAULT_AUTH_PATH?: string;
  VAULT_AUTH_NAMESPACE?: string;
  VAULT_AUTH_MOUNT_PATH?: string;
} & VaultCommonConfigMap;

export type VaultConfigMap = VaultTokenConfigMap | VaultSAConfigMap;

export type HpcsConfigMap = {
  KMS_PROVIDER: string;
  KMS_SERVICE_NAME: string;
  IBM_KP_SERVICE_INSTANCE_ID: string;
  IBM_KP_SECRET_NAME: string;
  IBM_KP_BASE_URL: string;
  IBM_KP_TOKEN_URL: string;
};

export type WatchCephResource = {
  ceph: K8sResourceKind[];
};

export type CephClusterKind = K8sResourceCommon & {
  status: {
    storage: {
      deviceClasses: CephDeviceClass[];
    };
    phase?: string;
  };
};

type CephDeviceClass = {
  name: string;
};

export type StoragePoolKind = K8sResourceCommon & {
  spec: {
    compressionMode?: string;
    deviceClass?: string;
    failureDomain?: string;
    replicated: {
      size: number;
    };
    parameters?: {
      compression_mode: string;
    };
    mirroring?: {
      enabled: boolean;
    };
  };
  status?: {
    phase?: string;
    mirroringStatus?: {
      lastChecked: string;
      summary: {
        image_health: string;
        states: ImageStates | {};
      };
    };
  };
};

export enum ImageStates {
  STARTING_REPLAY = 'starting_replay',
  STOPPING_REPLAY = 'stopping_replay',
  REPLAYING = 'replaying',
  STOPPED = 'stopped',
  ERROR = 'error',
  SYNCING = 'syncing',
  UNKNOWN = 'unknown',
}

export type StorageClusterKind = K8sResourceCommon & {
  // https://pkg.go.dev/github.com/red-hat-storage/ocs-operator/api/v1#StorageCluster
  spec: {
    network?: {
      provider: string;
      selectors: {
        public: string;
        private?: string;
      };
    };
    manageNodes?: boolean;
    storageDeviceSets?: DeviceSet[];
    resources?: StorageClusterResource;
    arbiter?: {
      enable: boolean;
    };
    nodeTopologies?: {
      arbiterLocation: string;
    };
    encryption?: {
      /** @deprecated - enable is deprecated from 4.10 */
      enable: boolean;
      clusterWide: boolean;
      storageClass: boolean;
      kms?: {
        enable: boolean;
      };
    };
    flexibleScaling?: boolean;
    monDataDirHostPath?: string;
    multiCloudGateway?: {
      reconcileStrategy: string;
      dbStorageClassName: string;
    };
  };
  status?: {
    phase: string;
    failureDomain?: string;
  };
};

export type DeviceSet = {
  // https://pkg.go.dev/github.com/red-hat-storage/ocs-operator/api/v1#StorageDeviceSet
  name: string;
  count: number;
  replica: number;
  resources: ResourceConstraints;
  placement?: any;
  portable: boolean;
  dataPVCTemplate: {
    spec: {
      storageClassName: string;
      accessModes: string[];
      volumeMode: string;
      resources: {
        requests: {
          storage: string;
        };
      };
    };
  };
};

export type StorageClusterResource = {
  mds?: ResourceConstraints;
  rgw?: ResourceConstraints;
};

export type ResourceConstraints = {
  limits?: {
    cpu: string;
    memory: string;
  };
  requests?: {
    cpu: string;
    memory: string;
  };
};

export type DiscoveredDisk = {
  node: string;
} & DiskMetadata;

export type NavUtils = {
  getStep: (maxSteps?: number) => number;
  getParamString: (step: number, mode: number) => string;
  getIndex: (searchSpace: any, search: React.ReactText, offset?: number) => number;
  getAnchor: (step: number, mode: number) => string;
};

export type Payload = K8sResourceCommon & {
  spec: {
    type: string;
    ssl: boolean;
    [key: string]: any;
  };
};

export type OcsStorageClassKind = StorageClassResourceKind & {
  parameters: {
    pool: string;
  };
};

export type StorageSystemKind = K8sResourceCommon & {
  spec: {
    // kind is a string as `<kind>.<apiGroup>/<apiVersion>`, describing the managed storage vendor CR
    kind: string;
    // name describes the name of managed storage vendor CR
    name: string;
    // namespace describes the name of managed storage vendor CR
    namespace: string;
  };
  status?: {
    phase?: string;
    conditions?: any;
  };
};
