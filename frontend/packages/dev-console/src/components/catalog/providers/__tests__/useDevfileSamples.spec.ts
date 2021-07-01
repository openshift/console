import { act } from 'react-dom/test-utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import { testHook } from '../../../../../../../__tests__/utils/hooks-utils';
import { DevfileSample } from '../../../import/devfile/devfile-types';
import useDevfileSamples from '../useDevfileSamples';
import { devfileSamples, expectedCatalogItems } from './useDevfileSamples.data';

jest.mock('react-i18next', () => ({
  ...require.requireActual('react-i18next'),
  useTranslation: () => ({ t: (key) => key.split('~')[1] }),
}));

jest.mock('@console/internal/co-fetch', () => ({
  coFetchJSON: {
    put: jest.fn(),
  },
}));

const putMock = coFetchJSON.put as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('useDevfileSamples:', () => {
  it('should return loaded false until data are loaded', async () => {
    let resolver: (samples: DevfileSample[]) => void;
    putMock.mockReturnValue(new Promise((resolve) => (resolver = resolve)));

    const { result } = testHook(() => useDevfileSamples({}));

    expect(putMock).toHaveBeenCalledTimes(1);
    expect(putMock).toHaveBeenLastCalledWith('/api/devfile/samples', {
      registry: 'sample-placeholder',
    });

    expect(result.current).toEqual([[], false, undefined]);

    await act(async () => resolver(devfileSamples));

    expect(result.current).toEqual([expectedCatalogItems, true, undefined]);
  });

  it('should return loaded false until fetch fails', async () => {
    let rejector: (error: Error) => void;
    putMock.mockReturnValue(new Promise((_, reject) => (rejector = reject)));

    const { result } = testHook(() => useDevfileSamples({}));

    expect(putMock).toHaveBeenCalledTimes(1);
    expect(putMock).toHaveBeenLastCalledWith('/api/devfile/samples', {
      registry: 'sample-placeholder',
    });

    expect(result.current).toEqual([[], false, undefined]);

    await act(async () => rejector(new Error('API call failed')));

    expect(result.current).toEqual([[], false, new Error('API call failed')]);
  });
});
