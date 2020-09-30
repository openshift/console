import { LimitsData } from '@console/dev-console/src/components/import/import-types';
import {
  EventSourceApiServerModel,
  EventSourceContainerModel,
  EventSourceCronJobModel,
  EventSourceKafkaModel,
  EventSourcePingModel,
  EventSourceSinkBindingModel,
  EventingChannelModel,
  EventingIMCModel,
  EventingKafkaChannelModel,
} from '../../models';

export const EventSources = {
  ApiServerSource: EventSourceApiServerModel.kind,
  ContainerSource: EventSourceContainerModel.kind,
  CronJobSource: EventSourceCronJobModel.kind,
  KafkaSource: EventSourceKafkaModel.kind,
  PingSource: EventSourcePingModel.kind,
  SinkBinding: EventSourceSinkBindingModel.kind,
};
export const defaultChannels = {
  Channel: EventingChannelModel,
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
  limits: LimitsData;
  data?: EventSourceData;
  yamlData?: string;
}

export interface EventSourceList {
  title: string;
  iconUrl: string;
  name: string;
  displayName: string;
  [x: string]: any;
}

export interface NormalizedEventSources {
  [eventSourceName: string]: EventSourceList;
}

export interface EventSourceListData {
  loaded: boolean;
  eventSourceList: NormalizedEventSources;
}

export enum SinkType {
  Resource = 'resource',
  Uri = 'uri',
}

export const EVENT_SOURCES_APP = 'event-sources-app';

export const sourceSinkType = {
  Resource: {
    value: SinkType.Resource,
    label: 'Resource',
  },
  Uri: {
    value: SinkType.Uri,
    label: 'URI',
  },
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
