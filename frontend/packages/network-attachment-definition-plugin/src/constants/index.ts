// t('kubevirt-plugin~Create network attachment definition')
export const NET_ATTACH_DEF_HEADER_LABEL = 'Create network attachment definition';

export const ELEMENT_TYPES = {
  CHECKBOX: 'checkbox',
  DROPDOWN: 'dropdown',
  TEXT: 'text',
  TEXTAREA: 'textarea',
};

export const cnvBridgeNetworkType = 'cnv-bridge';
export const ovnKubernetesNetworkType = 'ovn-k8s-cni-overlay';
export const ovnKubernetesSecondaryLocalnet = 'ovn-k8s-cni-overlay-localnet';

export const networkTypes = {
  sriov: 'SR-IOV',
  [cnvBridgeNetworkType]: 'CNV Linux bridge',
  [ovnKubernetesNetworkType]: 'OVN Kubernetes L2 overlay network',
  [ovnKubernetesSecondaryLocalnet]: 'OVN Kubernetes secondary localnet network',
};

export enum NetworkTypes {
  SRIOV = 'SR-IOV',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'CNV-Bridge' = 'CNV Linux bridge',
}

// t('kubevirt-plugin~Resource name')
// t('kubevirt-plugin~VLAN tag number')
// t('kubevirt-plugin~IP address management')
// t('kubevirt-plugin~Bridge name')
// t('kubevirt-plugin~MAC spoof check')
// t('kubevirt-plugin~Bridge mapping')
// t('kubevirt-plugin~Physical network name. A bridge mapping must be configured on cluster nodes to map between physical network names and Open vSwitch bridges.')
// t('kubevirt-plugin~MTU')
// t('kubevirt-plugin~VLAN')

export const networkTypeParams: NetworkTypeParamsList = {
  sriov: {
    resourceName: {
      name: 'Resource name',
      values: {},
      required: true,
      type: ELEMENT_TYPES.DROPDOWN,
    },
    vlanTagNum: {
      name: 'VLAN tag number',
      hintText: 'Ex: 100',
      type: ELEMENT_TYPES.TEXT,
    },
    ipam: {
      name: 'IP address management',
      type: ELEMENT_TYPES.TEXTAREA,
    },
  },
  [cnvBridgeNetworkType]: {
    bridge: {
      name: 'Bridge name',
      required: true,
      type: ELEMENT_TYPES.TEXT,
    },
    vlanTagNum: {
      name: 'VLAN tag number',
      hintText: 'Ex: 100',
      type: ELEMENT_TYPES.TEXT,
    },
    macspoofchk: {
      name: 'MAC spoof check',
      type: ELEMENT_TYPES.CHECKBOX,
      initValue: true,
    },
  },
  [ovnKubernetesSecondaryLocalnet]: {
    bridgeMapping: {
      name: 'Bridge mapping',
      type: ELEMENT_TYPES.TEXT,
      required: true,
      hintText:
        'Physical network name. A bridge mapping must be configured on cluster nodes to map between physical network names and Open vSwitch bridges.',
    },
    mtu: {
      name: 'MTU',
      type: ELEMENT_TYPES.TEXT,
    },
    vlanID: {
      name: 'VLAN',
      type: ELEMENT_TYPES.TEXT,
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
