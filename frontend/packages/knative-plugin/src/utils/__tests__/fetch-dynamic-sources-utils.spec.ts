import * as coFetch from '@console/internal/co-fetch';
import { eventSourceData, getSourcesModel } from '../fetch-dynamic-sources-utils';

describe('fetch-dynamic-sources: ', () => {
  it('should call coFetch to fetch CRDs for duck type', async () => {
    const fetchSpy = jest.spyOn(coFetch, 'coFetch');
    await getSourcesModel();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should fetch models for duck type in case of error', async () => {
    jest.spyOn(coFetch, 'coFetch').mockImplementation(() => Promise.reject(new Error('Error')));
    await getSourcesModel();
    expect(eventSourceData.models).toHaveLength(6);
  });
});
