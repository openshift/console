import { TFunction } from 'i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import {
  EventSourceApiServerModel,
  EventSourceContainerModel,
  EventSourceCronJobModel,
  EventSourceKafkaModel,
  EventSourcePingModel,
  EventSourceSinkBindingModel,
  EventingIMCModel,
  EventingKafkaChannelModel,
  CamelKameletBindingModel,
} from '../../models';

export const EventSources = {
  ApiServerSource: EventSourceApiServerModel.kind,
  ContainerSource: EventSourceContainerModel.kind,
  CronJobSource: EventSourceCronJobModel.kind,
  KafkaSource: EventSourceKafkaModel.kind,
  PingSource: EventSourcePingModel.kind,
  SinkBinding: EventSourceSinkBindingModel.kind,
  KameletBinding: CamelKameletBindingModel.kind,
};
export const defaultChannels = {
  InMemoryChannel: EventingIMCModel,
  KafkaChannel: EventingKafkaChannelModel,
};
export interface ProjectData {
  name: string;
  displayName: string;
  description: string;
}

export interface ApplicationData {
  initial: string;
  name: string;
  selectedKey: string;
}

export interface EventSourceData {
  [x: string]: any;
}

export interface SinkResourceData {
  apiVersion: string;
  name: string;
  kind: string;
  key: string;
  uri?: string;
}

export interface EventSourceFormData {
  project: ProjectData;
  application: ApplicationData;
  name: string;
  apiVersion: string;
  type: string;
  sinkType: string;
  sink: SinkResourceData;
  data?: EventSourceData;
}

export interface EventSourceSyncFormData {
  editorType?: string;
  showCanUseYAMLMessage?: boolean;
  formData: EventSourceFormData;
  yamlData?: string;
}

export interface EventSourceMetaData {
  name: string;
  description?: string;
  provider?: string;
  iconUrl?: string;
}
export interface EventSourceListData {
  loaded: boolean;
  eventSourceList: CatalogItem[];
}

export enum SinkType {
  Resource = 'resource',
  Uri = 'uri',
}

export const sourceSinkType = (t: TFunction) => {
  return {
    Resource: {
      value: SinkType.Resource,
      label: t('knative-plugin~Resource'),
    },
    Uri: {
      value: SinkType.Uri,
      label: t('knative-plugin~URI'),
    },
  };
};
export interface AddChannelFormData {
  application: ApplicationData;
  name: string;
  namespace: string;
  apiVersion: string;
  type: string;
  data?: EventSourceData;
  yamlData?: string;
}

export interface ChannelListProps {
  loaded: boolean;
  channelList: string[];
}

export interface AddBrokerFormYamlValues {
  editorType: string;
  showCanUseYAMLMessage: boolean;
  formData: BrokerFormData;
  yamlData: string;
}

export interface BrokerFormData {
  project: ProjectData;
  application: ApplicationData;
  name: string;
  spec: {};
}
