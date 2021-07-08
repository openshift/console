import {
  mockServiceData,
  mockUpdateRequestObj,
  mockTrafficData,
  mockRevisions,
  mockRevisionItems,
} from '../__mocks__/traffic-splitting-utils-mock';
import { constructObjForUpdate, getRevisionItems } from '../traffic-splitting-utils';

describe('Traffic Splitting', () => {
  it('should construct the object for Update Request', async () => {
    const obj = constructObjForUpdate(mockTrafficData, mockServiceData);
    expect(obj).toEqual(mockUpdateRequestObj);
  });
  it('should fetch the revision items', async () => {
    const items = getRevisionItems(mockRevisions);
    expect(items).toEqual(mockRevisionItems);
  });
});
