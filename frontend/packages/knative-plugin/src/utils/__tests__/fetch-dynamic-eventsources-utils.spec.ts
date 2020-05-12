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
import { mockEventSourcCRDData } from '../__mocks__/dynamic-event-source-crd-mock';

describe('fetch-dynamic-eventsources: ', () => {
  beforeEach(() => {
    jest.spyOn(coFetch, 'coFetch').mockImplementation(() =>
      Promise.resolve({
        json: () => ({ ...mockEventSourcCRDData }),
      }),
    );
  });

  it('should call coFetch to fetch CRDs for duck type', async () => {
    const fetchSpy = jest.spyOn(coFetch, 'coFetch');
    await fetchEventSourcesCrd();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch models for duck type in case of error', async () => {
    jest.spyOn(coFetch, 'coFetch').mockImplementation(() => Promise.reject(new Error('Error')));
    await fetchEventSourcesCrd();
    expect(getEventSourceModels()).toHaveLength(0);
  });

  it('should return true for event source model', async () => {
    await fetchEventSourcesCrd();
    expect(isDynamicEventResourceKind(referenceForModel(EventSourceContainerModel))).toBe(true);
  });

  it('should return false for event source model', async () => {
    await fetchEventSourcesCrd();
    expect(isDynamicEventResourceKind(referenceForModel(ServiceModel))).toBe(false);
  });

  it('should return refs for all event source models', async () => {
    await fetchEventSourcesCrd();
    const expectedRefs = [
      referenceForModel(EventSourceContainerModel),
      referenceForModel(EventSourceApiServerModel),
      referenceForModel(EventSourceSinkBindingModel),
      referenceForModel(EventSourcePingModel),
    ];
    const modelRefs = getDynamicEventSourcesModelRefs();
    expectedRefs.forEach((ref) => {
      expect(modelRefs.includes(ref)).toBe(true);
    });
  });

  it('should return model from the dynamic event sources', async () => {
    await fetchEventSourcesCrd();
    const ref = referenceForModel(EventSourceContainerModel);
    const resultModel = getDynamicEventSourceModel(ref);
    expect(isEqual(referenceForModel(resultModel), ref)).toBe(true);
  });

  it('should return undefined if model is not found', () => {
    const resultModel = getDynamicEventSourceModel(referenceForModel(ServiceModel));
    expect(resultModel).toBe(undefined);
  });
});
