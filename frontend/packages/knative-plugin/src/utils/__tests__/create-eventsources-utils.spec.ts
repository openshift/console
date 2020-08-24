import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel, EventSourceCronJobModel, EventSourceSinkBindingModel } from '../../models';
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
    mockData.apiVersion = 'sources.knative.dev/v1alpha2';
    const knEventingResource: K8sResourceKind = getEventSourceResource(mockData);
    expect(knEventingResource.kind).toBe(EventSourceSinkBindingModel.kind);
    expect(knEventingResource.apiVersion).toBe(
      `${EventSourceSinkBindingModel.apiGroup}/${EventSourceSinkBindingModel.apiVersion}`,
    );
  });
});
