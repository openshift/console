import { TFunction } from 'i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import {
  EVENTING_KAFKA_CHANNEL_KIND,
  EVENTING_IMC_KIND,
  EVENT_SOURCE_SINK_BINDING_KIND,
  EVENT_SOURCE_API_SERVER_KIND,
  EVENT_SOURCE_CONTAINER_KIND,
  EVENT_SOURCE_PING_KIND,
  EVENT_SOURCE_KAFKA_KIND,
} from '../../const';
import { CamelKameletBindingModel } from '../../models';

export const EventSources = {
  ApiServerSource: EVENT_SOURCE_API_SERVER_KIND,
  ContainerSource: EVENT_SOURCE_CONTAINER_KIND,
  KafkaSource: EVENT_SOURCE_KAFKA_KIND,
  PingSource: EVENT_SOURCE_PING_KIND,
  SinkBinding: EVENT_SOURCE_SINK_BINDING_KIND,
  KameletBinding: CamelKameletBindingModel.kind,
};

export const defaultChannels = {
  InMemoryChannel: EVENTING_IMC_KIND,
  KafkaChannel: EVENTING_KAFKA_CHANNEL_KIND,
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
export interface EventSinkFormData {
  project: ProjectData;
  application: ApplicationData;
  name: string;
  apiVersion: string;
  type: string;
  source: SinkResourceData;
  data?: EventSourceData;
}

export interface EventSinkSyncFormData {
  editorType?: string;
  showCanUseYAMLMessage?: boolean;
  formData: EventSinkFormData;
  yamlData?: string;
}

export type YamlFormSyncData<T> = {
  editorType?: string;
  showCanUseYAMLMessage?: boolean;
  formData: T;
  yamlData?: string;
};

export interface KnEventCatalogMetaData {
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
  project?: ProjectData;
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
