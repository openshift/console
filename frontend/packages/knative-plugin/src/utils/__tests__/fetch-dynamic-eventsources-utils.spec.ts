import { isEqual } from 'lodash';
import * as coFetch from '@console/internal/co-fetch';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  EventSourceApiServerModel,
  EventSourceSinkBindingModel,
  EventSourceKafkaModel,
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceCamelModel,
  ServiceModel,
} from '../../models';
import {
  getEventSourceModels,
  fetchEventSourcesCrd,
  isDynamicEventResourceKind,
  getDynamicEventSourcesModelRefs,
  getDynamicEventSourceModel,
} from '../fetch-dynamic-eventsources-utils';

describe('fetch-dynamic-eventsources: ', () => {
  it('should call coFetch to fetch CRDs for duck type', async () => {
    const fetchSpy = jest.spyOn(coFetch, 'coFetch');
    await fetchEventSourcesCrd();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch models for duck type in case of error', async () => {
    jest.spyOn(coFetch, 'coFetch').mockImplementation(() => Promise.reject(new Error('Error')));
    await fetchEventSourcesCrd();
    expect(getEventSourceModels()).toHaveLength(6);
  });

  it('should return true for event source model', () => {
    expect(isDynamicEventResourceKind(referenceForModel(EventSourceCronJobModel))).toBe(true);
  });

  it('should return false for event source model', () => {
    expect(isDynamicEventResourceKind(referenceForModel(ServiceModel))).toBe(false);
  });

  it('should return refs for all event source models', () => {
    const expectedRefs = [
      referenceForModel(EventSourceCronJobModel),
      referenceForModel(EventSourceContainerModel),
      referenceForModel(EventSourceApiServerModel),
      referenceForModel(EventSourceSinkBindingModel),
      referenceForModel(EventSourceKafkaModel),
      referenceForModel(EventSourceCamelModel),
    ];
    const modelRefs = getDynamicEventSourcesModelRefs();
    expect(modelRefs).toHaveLength(6);
    modelRefs.forEach((ref) => {
      expect(expectedRefs.includes(ref)).toBe(true);
    });
  });

  it('should return model from the dynamic event sources', () => {
    const resultModel = getDynamicEventSourceModel(referenceForModel(EventSourceCronJobModel));
    expect(isEqual(resultModel, EventSourceCronJobModel)).toBe(true);
  });

  it('should return undefined if model is not found', () => {
    const resultModel = getDynamicEventSourceModel(referenceForModel(ServiceModel));
    expect(resultModel).toBe(undefined);
  });
});
