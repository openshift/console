import { isEqual } from 'lodash';
import * as coFetch from '@console/internal/co-fetch';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  EventSourceApiServerModel,
  EventSourceSinkBindingModel,
  EventSourceContainerModel,
  EventSourcePingModel,
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
    expect(getEventSourceModels()).toHaveLength(4);
  });

  it('should return true for event source model', () => {
    expect(isDynamicEventResourceKind(referenceForModel(EventSourceContainerModel))).toBe(true);
  });

  it('should return false for event source model', () => {
    expect(isDynamicEventResourceKind(referenceForModel(ServiceModel))).toBe(false);
  });

  it('should return refs for all event source models', () => {
    const expectedRefs = [
      referenceForModel(EventSourceContainerModel),
      referenceForModel(EventSourceApiServerModel),
      referenceForModel(EventSourceSinkBindingModel),
      referenceForModel(EventSourcePingModel),
    ];
    const modelRefs = getDynamicEventSourcesModelRefs();
    expect(modelRefs).toHaveLength(4);
    modelRefs.forEach((ref) => {
      expect(expectedRefs.includes(ref)).toBe(true);
    });
  });

  it('should return model from the dynamic event sources', () => {
    const resultModel = getDynamicEventSourceModel(referenceForModel(EventSourceContainerModel));
    expect(isEqual(resultModel, EventSourceContainerModel)).toBe(true);
  });

  it('should return undefined if model is not found', () => {
    const resultModel = getDynamicEventSourceModel(referenceForModel(ServiceModel));
    expect(resultModel).toBe(undefined);
  });
});
