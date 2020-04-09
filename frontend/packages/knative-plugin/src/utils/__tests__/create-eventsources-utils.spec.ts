import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  ServiceModel,
  EventSourceCronJobModel,
  EventSourceSinkBindingModel,
  EventSourceKafkaModel,
} from '../../models';
import { getEventSourceResource } from '../create-eventsources-utils';
import { getDefaultEventingData } from './knative-serving-data';
import { EventSources } from '../../components/add/import-types';

describe('Create knative Utils', () => {
  it('expect response to be of kind CronJobSource with proper ApiGroup', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    mockData.apiVersion = 'sources.eventing.knative.dev/v1alpha1';
    const knEventingResource: K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.kind).toBe(EventSourceCronJobModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceCronJobModel.apiGroup}/${EventSourceCronJobModel.apiVersion}`,
    );
  });

  it('expect response to schedule in spec for CronJobSource', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    const knEventingResource: K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.spec.schedule).toBe('* * * * *');
  });

  it('expect response for sink to be of kind knative service', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    const knEventingResource: K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.spec.sink.ref.kind).toBe(ServiceModel.kind);
    expect(knEventingResource.spec.sink.ref.apiVersion).toBe(
      `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
    );
  });

  it('expect response to be of kind sinkBinding with proper ApiGroup', () => {
    const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
    const mockData = _.cloneDeep(defaultEventingData);
    mockData.type = 'SinkBinding';
    const knEventingResource: K8sResourceKind = getEventSourceResource(mockData);
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
    const knEventingResource: K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.kind).toBe(EventSourceKafkaModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceKafkaModel.apiGroup}/${EventSourceKafkaModel.apiVersion}`,
    );
    expect(knEventingResource.spec?.resources?.limits?.cpu).toBe('200m');
    expect(knEventingResource.spec?.resources?.requests?.cpu).toBe('100m');
  });
});
