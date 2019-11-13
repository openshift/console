export const NET_ATTACH_DEF_HEADER_LABEL = 'Create Network Attachment Definition';

export const ELEMENT_TYPES = {
  CHECKBOX: 'checkbox',
  DROPDOWN: 'dropdown',
  TEXT: 'text',
  TEXTAREA: 'textarea',
};

export const networkTypes = {
  sriov: 'SR-IOV',
  'cnv-bridge': 'CNV Linux bridge',
};

export enum NetworkTypes {
  SRIOV = 'SR-IOV',
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
  'cnv-bridge': {
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
  values?: { [key: string]: string };
};
