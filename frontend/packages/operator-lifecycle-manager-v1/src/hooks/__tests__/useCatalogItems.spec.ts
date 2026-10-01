import { act, renderHook, waitFor } from '@testing-library/react';
import { coFetch } from '@console/shared/src/utils/console-fetch';
import {
  getConsoleRequestHeaders,
  normalizeConsoleHeaders,
} from '@console/shared/src/utils/console-fetch-utils';
import type { OLMCatalogItem } from '../../types';
import useCatalogItems from '../useCatalogItems';

jest.mock('@console/dynamic-plugin-sdk/src/runtime/plugin-init', () => ({
  initConsolePlugins: jest.fn(),
}));

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetch: jest.fn(),
}));

jest.mock('@console/shared/src/utils/console-fetch-utils', () => ({
  getConsoleRequestHeaders: jest.fn(),
  normalizeConsoleHeaders: jest.fn(),
}));

const coFetchMock = jest.mocked(coFetch);
const catalogItem: OLMCatalogItem = {
  id: 'catalog/package/bundle',
  capabilities: '',
  catalog: 'catalog',
  categories: ['Storage'],
  createdAt: '',
  description: '',
  displayName: 'Test Package',
  hasIcon: false,
  image: '',
  infrastructureFeatures: [],
  keywords: [],
  markdownDescription: '',
  name: 'test-package',
  provider: '',
  repository: '',
  source: '',
  support: '',
  validSubscription: [],
  version: '2.0.0',
  availableVersions: ['2.0.0', '1.0.0'],
  clusterCompatibility: 'incompatible',
};

const createResponse = (
  items: OLMCatalogItem[] = [],
  lastModified: string | null = null,
  status = 200,
  statusText = 'OK',
): Response =>
  ({
    status,
    statusText,
    headers: { get: () => lastModified },
    json: jest.fn().mockResolvedValue(items),
  }) as unknown as Response;

describe('useCatalogItems', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    jest.mocked(getConsoleRequestHeaders).mockReturnValue({});
    jest.mocked(normalizeConsoleHeaders).mockReturnValue({});
    coFetchMock.mockResolvedValue(createResponse());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stays loading until the fetch resolves and cancels the request on unmount', () => {
    coFetchMock.mockReturnValue(new Promise(() => {}));

    const { result, unmount } = renderHook(() => useCatalogItems());
    const signal = coFetchMock.mock.calls[0][1]?.signal;

    expect(result.current[1]).toBe(false);
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it('returns normalized version metadata after a successful fetch', async () => {
    coFetchMock.mockResolvedValue(createResponse([catalogItem]));

    const { result } = renderHook(() => useCatalogItems());

    await waitFor(() => expect(result.current[1]).toBe(true));
    expect(result.current[0][0].data).toMatchObject({
      latestVersion: '2.0.0',
      availableVersions: ['2.0.0', '1.0.0'],
      clusterCompatibility: 'incompatible',
    });
    expect(result.current[2]).toBe('');
  });

  it('keeps cached items after a 304 response and cancels the previous request', async () => {
    const lastModified = 'Thu, 01 Jan 2026 00:00:00 GMT';
    const notModified = createResponse([], null, 304, 'Not Modified');
    coFetchMock
      .mockResolvedValueOnce(createResponse([catalogItem], lastModified))
      .mockResolvedValueOnce(notModified);
    const { result } = renderHook(() => useCatalogItems());
    await waitFor(() => expect(result.current[1]).toBe(true));
    const items = result.current[0];
    const previousSignal = coFetchMock.mock.calls[0][1]?.signal;

    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(coFetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/olm/catalog-items/',
      expect.objectContaining({
        headers: expect.objectContaining({ 'If-Modified-Since': lastModified }),
      }),
    );
    expect(result.current[0]).toBe(items);
    expect(notModified.json).not.toHaveBeenCalled();
    expect(previousSignal?.aborted).toBe(true);
    expect(result.current[2]).toBe('');
  });

  it('updates metadata while preserving the validator when Last-Modified is missing', async () => {
    const lastModified = 'Thu, 01 Jan 2026 00:00:00 GMT';
    coFetchMock
      .mockResolvedValueOnce(createResponse([catalogItem], lastModified))
      .mockResolvedValueOnce(
        createResponse([
          { ...catalogItem, availableVersions: ['3.0.0'], clusterCompatibility: 'unknown' },
        ]),
      );
    const { result } = renderHook(() => useCatalogItems());
    await waitFor(() => expect(result.current[1]).toBe(true));

    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(result.current[0][0].data).toMatchObject({
      availableVersions: ['3.0.0'],
      clusterCompatibility: 'unknown',
    });
    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });
    expect(coFetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/olm/catalog-items/',
      expect.objectContaining({
        headers: expect.objectContaining({ 'If-Modified-Since': lastModified }),
      }),
    );
  });

  it('sets loaded=true after a fetch error', async () => {
    coFetchMock.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCatalogItems());

    await waitFor(() => expect(result.current[1]).toBe(true));
    expect(result.current[2]).toContain('Network error');
  });

  it('reports unsuccessful HTTP responses', async () => {
    coFetchMock.mockResolvedValue(createResponse([], null, 503, 'Service Unavailable'));
    const { result } = renderHook(() => useCatalogItems());

    await waitFor(() => expect(result.current[1]).toBe(true));

    expect(result.current[2]).toBe('Error: HTTP 503: Service Unavailable');
  });

  it('ignores cancelled requests and succeeds on the next poll', async () => {
    coFetchMock.mockRejectedValueOnce(
      Object.assign(new Error('Cancelled'), { name: 'AbortError' }),
    );
    const { result } = renderHook(() => useCatalogItems());

    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBe('');
  });

  it('reports invalid JSON without returning catalog items', async () => {
    const response = createResponse();
    jest.mocked(response.json).mockRejectedValue(new SyntaxError('Invalid JSON'));
    coFetchMock.mockResolvedValue(response);
    const { result } = renderHook(() => useCatalogItems());

    await waitFor(() => expect(result.current[1]).toBe(true));

    expect(result.current[0]).toEqual([]);
    expect(result.current[2]).toBe('SyntaxError: Invalid JSON');
  });
});
