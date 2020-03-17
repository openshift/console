import { cloneDeep } from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel, EventSourceCronJobModel, EventSourceSinkBindingModel } from '../../models';
import { getEventSourcesDepResource } from '../create-eventsources-utils';
import { defaultEventingData } from './knative-serving-data';

describe('Create knative Utils', () => {
  it('expect response to be of kind CronJobSource with proper ApiGroup', () => {
    const mockData = cloneDeep(defaultEventingData);
    const knEventingResource: K8sResourceKind = getEventSourcesDepResource(mockData);
    expect(knEventingResource.kind).toBe(EventSourceCronJobModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceCronJobModel.apiGroup}/${EventSourceCronJobModel.apiVersion}`,
    );
  });

  it('expect response to data and schedule in spec', () => {
    const mockData = cloneDeep(defaultEventingData);
    const knEventingResource: K8sResourceKind = getEventSourcesDepResource(mockData);
    expect(knEventingResource.spec.data).toBe('hello');
    expect(knEventingResource.spec.schedule).toBe('* * * * *');
  });

  it('expect response for sink to be of kind knative service', () => {
    const mockData = cloneDeep(defaultEventingData);
    const knEventingResource: K8sResourceKind = getEventSourcesDepResource(mockData);
    expect(knEventingResource.spec.sink.ref.kind).toBe(ServiceModel.kind);
    expect(knEventingResource.spec.sink.ref.apiVersion).toBe(
      `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
    );
  });

  it('expect response to be of kind sinkBinding with proper ApiGroup', () => {
    const mockData = cloneDeep(defaultEventingData);
    mockData.type = 'SinkBinding';
    const knEventingResource: K8sResourceKind = getEventSourcesDepResource(mockData);
    expect(knEventingResource.kind).toBe(EventSourceSinkBindingModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceSinkBindingModel.apiGroup}/${EventSourceSinkBindingModel.apiVersion}`,
    );
  });
});
