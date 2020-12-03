import { IRow } from '@patternfly/react-table';
import { NodeKind, SecretKind } from '@console/internal/module/k8s';
import { TableProps } from '@console/internal/components/factory';

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

export type KMSConfig = {
  name: {
    value: string;
    valid: boolean;
  };
  token?: {
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
  backend: string;
  caCert: SecretKind;
  caCertFile: string;
  tls: string;
  clientCert: SecretKind;
  clientCertFile: string;
  clientKey: SecretKind;
  clientKeyFile: string;
  providerNamespace: string;
  hasHandled: boolean;
};

export enum NetworkType {
  DEFAULT = 'DEFAULT',
  MULTUS = 'MULTUS',
}
export type KMSConfigMap = {
  KMS_PROVIDER: string;
  KMS_SERVICE_NAME: string;
  VAULT_ADDR: string; // address + port
  VAULT_BACKEND_PATH: string;
  VAULT_CACERT: string;
  VAULT_CACERT_FILE?: string;
  VAULT_TLS_SERVER_NAME: string;
  VAULT_CLIENT_CERT: string;
  VAULT_CLIENT_CERT_FILE?: string;
  VAULT_CLIENT_KEY: string;
  VAULT_CLIENT_KEY_FILE?: string;
  VAULT_NAMESPACE: string;
  VAULT_TOKEN_NAME?: string;
};
