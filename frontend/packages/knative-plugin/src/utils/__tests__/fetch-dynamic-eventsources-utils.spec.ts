import * as coFetch from '@console/internal/co-fetch';
import { getEventSourceModels, fetchEventSourcesCrd } from '../fetch-dynamic-eventsources-utils';

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
});
