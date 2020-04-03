import { NetworkAttachmentDefinitionConfig } from '../../types';

export type NetAttachDefBundle = {
  name?: string;
  namespace?: string;
  type?: string;
  metadata?: any;
  configJSON?: NetworkAttachmentDefinitionConfig;
  netAttachDef: any;
};

export type NetworkAttachmentDefinitionsPageProps = {
  filterLabel: string;
  namespace?: string;
  match: any;
};
