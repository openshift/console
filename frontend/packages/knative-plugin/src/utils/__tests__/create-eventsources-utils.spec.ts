import * as _ from 'lodash';
import { safeDump } from 'js-yaml';
import * as k8sModels from '@console/internal/module/k8s';
import {
  ServiceModel,
  EventSourceCronJobModel,
  EventSourceSinkBindingModel,
  EventSourceKafkaModel,
  EventSourceCamelModel,
} from '../../models';
import {
  getEventSourceResource,
  getBootstrapServers,
  loadYamlData,
  getEventSourcesDepResource,
} from '../create-eventsources-utils';
import { getDefaultEventingData, Kafkas } from './knative-serving-data';
import { EventSources } from '../../components/add/import-types';

describe('Create knative Utils', () => {
  it('expect response to be of kind CronJobSource with proper ApiGroup', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    mockData.apiVersion = 'sources.eventing.knative.dev/v1alpha1';
    const knEventingResource: k8sModels.K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.kind).toBe(EventSourceCronJobModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceCronJobModel.apiGroup}/${EventSourceCronJobModel.apiVersion}`,
    );
  });

  it('expect response to schedule in spec for CronJobSource', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    const knEventingResource: k8sModels.K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.spec.schedule).toBe('* * * * *');
  });

  it('expect response for sink to be of kind knative service', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    const knEventingResource: k8sModels.K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.spec.sink.ref.kind).toBe(ServiceModel.kind);
    expect(knEventingResource.spec.sink.ref.apiVersion).toBe(
      `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
    );
  });

  it('expect response to be of kind sinkBinding with proper ApiGroup', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    mockData.type = 'SinkBinding';
    const knEventingResource: k8sModels.K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.kind).toBe(EventSourceSinkBindingModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceSinkBindingModel.apiGroup}/${EventSourceSinkBindingModel.apiVersion}`,
    );
  });

  it('expect response to be of kind kafkaSource with resource limits', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.KafkaSource);
    const mockData = _.cloneDeep(defaultEventingData);
    mockData.type = 'KafkaSource';
    mockData.limits.cpu.limit = '200';
    mockData.limits.cpu.request = '100';
    const knEventingResource: k8sModels.K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.kind).toBe(EventSourceKafkaModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceKafkaModel.apiGroup}/${EventSourceKafkaModel.apiVersion}`,
    );
    expect(knEventingResource.spec?.resources?.limits?.cpu).toBe('200m');
    expect(knEventingResource.spec?.resources?.requests?.cpu).toBe('100m');
  });

  it('should return bootstrapServers', () => {
    expect(getBootstrapServers(Kafkas)).toEqual([
      'my-cluster-kafka-bootstrap.div.svc:9092',
      'my-cluster-kafka-bootstrap.div.svc:9093',
      'my-cluster2-kafka-bootstrap.div.svc:9092',
      'my-cluster2-kafka-bootstrap.div.svc:9093',
    ]);
  });

  it('expect response of loadYamlData to have namespace as passed in yamlEditor', () => {
    jest.spyOn(k8sModels, 'modelFor').mockImplementation(() => EventSourceCamelModel);
    const defaultEventingData = getDefaultEventingData(EventSourceCamelModel.kind);
    const mockData = {
      ...defaultEventingData,
      yamlData: safeDump(getEventSourcesDepResource(defaultEventingData)),
    };
    const knEventingResource: k8sModels.K8sResourceKind = loadYamlData(mockData);
    expect(knEventingResource.kind).toBe(EventSourceCamelModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceCamelModel.apiGroup}/${EventSourceCamelModel.apiVersion}`,
    );
    expect(knEventingResource.metadata?.namespace).toEqual('mock-project');
  });

  it('expect response of loadYamlData to update namespace if not there yamlEditor', () => {
    jest.spyOn(k8sModels, 'modelFor').mockImplementation(() => EventSourceCamelModel);
    const defaultEventingData = getDefaultEventingData(EventSourceCamelModel.kind);
    defaultEventingData.project.name = '';
    const mockData = {
      ...getDefaultEventingData(EventSourceCamelModel.kind),
      yamlData: safeDump(getEventSourcesDepResource(defaultEventingData)),
    };
    const knEventingResource: k8sModels.K8sResourceKind = loadYamlData(mockData);
    expect(knEventingResource.kind).toBe(EventSourceCamelModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceCamelModel.apiGroup}/${EventSourceCamelModel.apiVersion}`,
    );
    expect(knEventingResource.metadata?.namespace).toEqual('mock-project');
  });
});
