import { NetworkAttachmentDefinitionConfig } from '../../types';

export type NetAttachDefBundle = {
  name?: string;
  namespace?: string;
  type?: string;
  metadata?: any;
  configJSON?: NetworkAttachmentDefinitionConfig;
  netAttachDef: any;
};

export type NetworkAttachmentDefinitionsRowProps = {
  obj: NetAttachDefBundle;
  index: number;
  key?: string;
  style: object;
};

export type NetworkAttachmentDefinitionsPageProps = {
  filterLabel: string;
  namespace?: string;
  match: any;
};
