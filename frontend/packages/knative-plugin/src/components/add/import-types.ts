import { LimitsData } from '@console/dev-console/src/components/import/import-types';
import {
  EventSourceApiServerModel,
  EventSourceContainerModel,
  EventSourceCronJobModel,
  EventSourceKafkaModel,
  EventSourcePingModel,
  EventSourceSinkBindingModel,
  EventSourceCamelModel,
} from '../../models';

export const EventSources = {
  ApiServerSource: EventSourceApiServerModel.kind,
  ContainerSource: EventSourceContainerModel.kind,
  CronJobSource: EventSourceCronJobModel.kind,
  KafkaSource: EventSourceKafkaModel.kind,
  PingSource: EventSourcePingModel.kind,
  SinkBinding: EventSourceSinkBindingModel.kind,
  CamelSource: EventSourceCamelModel.kind,
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

export interface KnativeServiceName {
  knativeService: string;
}

export interface EventSourceFormData {
  project: ProjectData;
  application: ApplicationData;
  name: string;
  apiVersion: string;
  type: string;
  sink: KnativeServiceName;
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
