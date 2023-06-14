export const NET_ATTACH_DEF_HEADER_LABEL = 'Create Network Attachment Definition';

export const ELEMENT_TYPES = {
  CHECKBOX: 'checkbox',
  DROPDOWN: 'dropdown',
  TEXT: 'text',
  TEXTAREA: 'textarea',
};

export const cnvBridgeNetworkType = 'cnv-bridge';
export const ovnKubernetesNetworkType = 'ovn-k8s-cni-overlay';

export const networkTypes = {
  sriov: 'SR-IOV',
  [cnvBridgeNetworkType]: 'CNV Linux bridge',
  [ovnKubernetesNetworkType]: 'OVN Kubernetes L2 overlay network',
};

export enum NetworkTypes {
  SRIOV = 'SR-IOV',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'CNV-Bridge' = 'CNV Linux bridge',
}

export const networkTypeParams: NetworkTypeParamsList = {
  sriov: {
    resourceName: {
      name: 'Resource Name',
      values: {},
      required: true,
      type: ELEMENT_TYPES.DROPDOWN,
    },
    vlanTagNum: {
      name: 'VLAN Tag Number',
      hintText: 'Ex: 100',
      type: ELEMENT_TYPES.TEXT,
    },
    ipam: {
      name: 'IP Address Management',
      type: ELEMENT_TYPES.TEXTAREA,
    },
  },
  [cnvBridgeNetworkType]: {
    bridge: {
      name: 'Bridge Name',
      required: true,
      type: ELEMENT_TYPES.TEXT,
    },
    vlanTagNum: {
      name: 'VLAN Tag Number',
      hintText: 'Ex: 100',
      type: ELEMENT_TYPES.TEXT,
    },
    macspoofchk: {
      name: 'MAC Spoof Check',
      type: ELEMENT_TYPES.CHECKBOX,
      initValue: true,
    },
  },
};

type NetworkTypeParamsList = {
  [key: string]: NetworkTypeParams;
};

export type NetworkTypeParams = {
  [key: string]: NetworkTypeParameter;
};

export type NetworkTypeParameter = {
  name: string;
  required?: boolean;
  type: string;
  hintText?: string;
  initValue?: any;
  values?: { [key: string]: string };
  validation?: (params: {
    [key: string]: { value: any; validationMsg: string | null };
  }) => string | null;
};
