import * as React from 'react';
import SubnetsHelperText from '../components/SubnetHelperText/SubnetHelperText';
import { validateIPOrSubnets, validateSubnets } from '../utils/utils';

// t('network-attachment-definition-plugin~Create network attachment definition')
export const NET_ATTACH_DEF_HEADER_LABEL = 'Create network attachment definition';

export const ELEMENT_TYPES = {
  CHECKBOX: 'checkbox',
  DROPDOWN: 'dropdown',
  TEXT: 'text',
  TEXTAREA: 'textarea',
};

export const bridgeNetworkType = 'bridge';
export const ovnKubernetesNetworkType = 'ovn-k8s-cni-overlay';
export const ovnKubernetesSecondaryLocalnet = 'ovn-k8s-cni-overlay-localnet';

export const networkTypes = {
  sriov: 'SR-IOV',
  [bridgeNetworkType]: 'Linux bridge',
  [ovnKubernetesNetworkType]: 'OVN Kubernetes L2 overlay network',
  [ovnKubernetesSecondaryLocalnet]: 'OVN Kubernetes secondary localnet network',
};

export enum NetworkTypes {
  SRIOV = 'SR-IOV',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'CNV-Bridge' = 'CNV Linux bridge',
}

// t('network-attachment-definition-plugin~Resource name')
// t('network-attachment-definition-plugin~VLAN tag number')
// t('network-attachment-definition-plugin~IP address management')
// t('network-attachment-definition-plugin~Bridge name')
// t('network-attachment-definition-plugin~MAC spoof check')
// t('network-attachment-definition-plugin~Bridge mapping')
// t('network-attachment-definition-plugin~Physical network name. Bridge mapping must be configured on cluster nodes to map between physical network names and Open vSwitch bridges.')
// t('network-attachment-definition-plugin~MTU')
// t('network-attachment-definition-plugin~VLAN')

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
  [bridgeNetworkType]: {
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
        'Physical network name. Bridge mapping must be configured on cluster nodes to map between physical network names and Open vSwitch bridges.',
    },
    mtu: {
      name: 'MTU',
      type: ELEMENT_TYPES.TEXT,
    },
    vlanID: {
      name: 'VLAN',
      type: ELEMENT_TYPES.TEXT,
    },
    subnets: {
      name: 'Subnets',
      type: ELEMENT_TYPES.TEXT,
      validation: (params) => validateSubnets(params?.subnets?.value),
      techPreview: true,
      hintText: <SubnetsHelperText />,
    },
    excludeSubnets: {
      name: 'Exclude subnets',
      type: ELEMENT_TYPES.TEXT,
      validation: (params) => validateIPOrSubnets(params?.excludeSubnets?.value),
    },
  },
  [ovnKubernetesNetworkType]: {
    subnets: {
      name: 'Subnets',
      type: ELEMENT_TYPES.TEXT,
      validation: (params) => validateSubnets(params?.subnets?.value),
      techPreview: true,
      hintText: <SubnetsHelperText />,
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
  hintText?: React.ReactNode;
  techPreview?: boolean;
  initValue?: any;
  values?: { [key: string]: string };
  validation?: (params: {
    [key: string]: { value: any; validationMsg: string | null };
  }) => string | null;
};
