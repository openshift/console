import { isEqual } from 'lodash';
import * as coFetchModule from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';
import { referenceForModel } from '@console/internal/module/k8s';
import { EVENTING_IMC_KIND } from '../../const';
import { ServiceModel } from '../../models';
import { mockChannelCRDData } from '../__mocks__/dynamic-channels-crd-mock';
import { mockEventSourcCRDData } from '../__mocks__/dynamic-event-source-crd-mock';
import {
  getEventSourceModels,
  fetchEventSourcesCrd,
  fetchChannelsCrd,
  isDynamicEventResourceKind,
  isEventingChannelResourceKind,
  getDynamicEventSourcesModelRefs,
  getDynamicChannelModelRefs,
  getDynamicEventSourceModel,
  getDynamicChannelResourceList,
  getDynamicEventSourcesResourceList,
  getDynamicChannelModel,
  getLabelPlural,
} from '../fetch-dynamic-eventsources-utils';

describe('fetch-dynamic-eventsources: EventSources', () => {
  beforeEach(() => {
    jest.spyOn(coFetchModule, 'consoleFetch').mockImplementation(() =>
      Promise.resolve({
        json: () => ({
          ...mockEventSourcCRDData,
        }),
      }),
    );
  });

  it('should call coFetch to fetch CRDs for duck type', async () => {
    const fetchSpy = jest.spyOn(coFetchModule, 'consoleFetch');
    await fetchEventSourcesCrd();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch models for duck type in case of error', async () => {
    // Suppress the warning to clean up the test output
    jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    jest
      .spyOn(coFetchModule, 'consoleFetch')
      .mockImplementation(() => Promise.reject(new Error('Test Error')));
    await fetchEventSourcesCrd();
    expect(getEventSourceModels()).toHaveLength(0);

    // eslint-disable-next-line no-console
    (console.warn as any).mockRestore();
  });

  it('should return true for event source model', async () => {
    await fetchEventSourcesCrd();
    expect(isDynamicEventResourceKind('sources.knative.dev~v1~ContainerSource')).toBe(true);
  });

  it('should return false for event source model', async () => {
    await fetchEventSourcesCrd();
    expect(isDynamicEventResourceKind(referenceForModel(ServiceModel))).toBe(false);
  });

  it('should return refs for all event source models', async () => {
    await fetchEventSourcesCrd();
    const expectedRefs = [
      'sources.knative.dev~v1~ContainerSource',
      'sources.knative.dev~v1~ApiServerSource',
      'sources.knative.dev~v1~SinkBinding',
      'sources.knative.dev~v1~PingSource',
    ];
    const modelRefs = getDynamicEventSourcesModelRefs();
    expectedRefs.forEach((ref) => {
      expect(modelRefs.includes(ref)).toBe(true);
    });
  });

  it('should return model from the dynamic event sources', async () => {
    await fetchEventSourcesCrd();
    const ref = 'sources.knative.dev~v1~ContainerSource';
    const resultModel = getDynamicEventSourceModel(ref);
    expect(isEqual(referenceForModel(resultModel), ref)).toBe(true);
  });

  it('should return undefined if model is not found', () => {
    const resultModel = getDynamicEventSourceModel(referenceForModel(ServiceModel));
    expect(resultModel).toBe(undefined);
  });

  it('should return limit if passed to getDynamicEventSourcesResourceList', async () => {
    await fetchEventSourcesCrd();
    const resultModel = getDynamicEventSourcesResourceList('sample-app', 1);
    expect(resultModel[0].limit).toBe(1);
  });

  it('should not return limit if not passed to getDynamicEventSourcesResourceList', async () => {
    await fetchEventSourcesCrd();
    const resultModel = getDynamicEventSourcesResourceList('sample-app');
    expect(resultModel[0].limit).toBeUndefined();
  });

  it('should return the correct plural version of the kind', () => {
    let kind = 'AbcClass';
    let plural = 'abcclasses';
    expect(getLabelPlural(kind, plural)).toBe('AbcClasses');
    kind = 'SinkBinding';
    plural = 'sinkbindings';
    expect(getLabelPlural(kind, plural)).toBe('SinkBindings');
  });
});

describe('fetch-dynamic-eventsources: Channels', () => {
  beforeEach(async () => {
    jest.spyOn(coFetchModule, 'consoleFetch').mockImplementation(() =>
      Promise.resolve({
        json: () => ({ ...mockChannelCRDData }),
      }),
    );
  });

  it('should return true for IMC channel model', async () => {
    await fetchChannelsCrd();
    expect(isEventingChannelResourceKind('messaging.knative.dev~v1~InMemoryChannel')).toBe(true);
  });

  it('should return false for ksvc model', async () => {
    await fetchChannelsCrd();
    expect(isEventingChannelResourceKind(referenceForModel(ServiceModel))).toBe(false);
  });

  it('should return refs for all channel models', async () => {
    await fetchChannelsCrd();
    const expectedRefs = ['messaging.knative.dev~v1~InMemoryChannel'];
    const modelRefs = getDynamicChannelModelRefs();
    expectedRefs.forEach((ref) => {
      expect(modelRefs.includes(ref)).toBe(true);
    });
  });

  it('should return limit if passed to getDynamicChannelResourceList', async () => {
    await fetchChannelsCrd();
    const resultModel = getDynamicChannelResourceList('sample-app', 1);
    expect(resultModel[0].limit).toBe(1);
  });

  it('should not return limit if not passed to getDynamicChannelResourceList', async () => {
    await fetchChannelsCrd();
    const resultModel = getDynamicChannelResourceList('sample-app');
    expect(resultModel[0].limit).toBeUndefined();
  });

  it('should get model from reference', async () => {
    await fetchChannelsCrd();
    const resultModel = getDynamicChannelModel('messaging.knative.dev~v1~InMemoryChannel');
    expect(resultModel.kind).toEqual(EVENTING_IMC_KIND);
  });

  it('should get model from reference', async () => {
    await fetchChannelsCrd();
    const resultModel = getDynamicChannelModel('ab~v1~r');
    expect(resultModel).toEqual(undefined);
  });
});
