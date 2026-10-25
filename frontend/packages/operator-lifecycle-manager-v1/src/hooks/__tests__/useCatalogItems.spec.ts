import { renderHook, waitFor } from '@testing-library/react';
import { coFetch } from '@console/shared/src/utils/console-fetch';
import {
  getConsoleRequestHeaders,
  normalizeConsoleHeaders,
} from '@console/shared/src/utils/console-fetch-utils';
import useCatalogItems from '../useCatalogItems';

jest.mock('@console/shared/src/hooks/usePoll', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    usePoll: function usePoll(callback: () => void) {
      useEffect(() => {
        callback();
      }, [callback]);
    },
  };
});

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetch: jest.fn(),
}));

jest.mock('@console/shared/src/utils/console-fetch-utils', () => ({
  getConsoleRequestHeaders: jest.fn(),
  normalizeConsoleHeaders: jest.fn(),
}));

jest.mock('../../utils/catalog-item', () => ({
  normalizeCatalogItem: jest.fn((item) => item),
}));

const coFetchMock = jest.mocked(coFetch);

describe('useCatalogItems', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getConsoleRequestHeaders).mockReturnValue({});
    jest.mocked(normalizeConsoleHeaders).mockReturnValue({});
  });

  it('starts with loaded=false before fetch resolves', () => {
    coFetchMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCatalogItems());

    expect(result.current[1]).toBe(false);
  });

  it('sets loaded=true after a successful fetch', async () => {
    coFetchMock.mockResolvedValue({
      status: 200,
      headers: { get: () => 'Thu, 01 Jan 2026 00:00:00 GMT' },
      json: () => Promise.resolve([]),
    } as unknown as Response);

    const { result } = renderHook(() => useCatalogItems());

    await waitFor(() => expect(result.current[1]).toBe(true));
    expect(result.current[2]).toBe('');
  });

  it('sets loaded=true after a fetch error', async () => {
    coFetchMock.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCatalogItems());

    await waitFor(() => expect(result.current[1]).toBe(true));
    expect(result.current[2]).toContain('Network error');
  });
});
