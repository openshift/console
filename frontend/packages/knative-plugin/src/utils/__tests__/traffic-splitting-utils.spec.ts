import {
  mockServiceData,
  mockTrafficData,
  mockRevisions,
  mockRevisionItems,
} from '../__mocks__/traffic-splitting-utils-mock';
import { trafficDataForPatch, getRevisionItems } from '../traffic-splitting-utils';

describe('Traffic Splitting', () => {
  it('should construct the traffic data for path Request replace', () => {
    const serviceData = {
      ...mockServiceData,
      spec: {
        ...mockServiceData.spec,
        traffic: [
          {
            latestRevision: true,
            percent: 100,
          },
        ],
      },
    };
    const ksvcPatchData = trafficDataForPatch(mockTrafficData, serviceData);
    expect(ksvcPatchData).toEqual([
      {
        op: 'replace',
        path: '/spec/traffic',
        value: mockTrafficData,
      },
    ]);
  });

  it('should construct the traffic data for path Request add', () => {
    const ksvcPatchData = trafficDataForPatch(mockTrafficData, mockServiceData);
    expect(ksvcPatchData).toEqual([
      {
        op: 'add',
        path: '/spec/traffic',
        value: mockTrafficData,
      },
    ]);
  });

  it('should fetch the revision items', async () => {
    const items = getRevisionItems(mockRevisions);
    expect(items).toEqual(mockRevisionItems);
  });
});
