export enum EventSources {
  CronJobSource = 'CronJobSource',
  ContainerSource = 'ContainerSource',
  ApiServerSource = 'ApiServerSource',
  KafkaSource = 'KafkaSource',
  CamelkSource = 'CamelSource',
  SinkBinding = 'SinkBinding',
}

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
  type: string;
  sink: KnativeServiceName;
  data?: EventSourceData;
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
