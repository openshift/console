import type { FC, ReactNode } from 'react';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import type {
  K8sResourceCommon,
  ResourceFilters,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useConsoleDataViewFilters } from '../useConsoleDataViewFilters';

jest.mock('@console/internal/components/factory/table-filters', () => ({
  exactMatch: (filter: string, value: string) => !filter || value?.includes(filter),
  fuzzyCaseInsensitive: (filter: string, value: string) =>
    !filter || value?.toLowerCase().includes(filter.toLowerCase()),
}));

jest.mock('@console/shared/src/utils/label-filter', () => ({
  mapLabelsToStrings: (labels: Record<string, string> = {}) =>
    Object.entries(labels).map(([k, v]) => `${k}=${v}`),
}));

jest.mock('@console/app/src/components/user-preferences/search/useExactSearch', () => ({
  useExactSearch: jest.fn(() => [false, true]),
}));

const { useExactSearch } = jest.requireMock(
  '@console/app/src/components/user-preferences/search/useExactSearch',
) as { useExactSearch: jest.Mock };

const mockData: K8sResourceCommon[] = [
  { metadata: { name: 'api-server', labels: { app: 'api' } }, kind: 'Pod', apiVersion: 'v1' },
  {
    metadata: { name: 'web-frontend', labels: { app: 'web', tier: 'frontend' } },
    kind: 'Pod',
    apiVersion: 'v1',
  },
  {
    metadata: { name: 'api-gateway', labels: { app: 'api', tier: 'gateway' } },
    kind: 'Pod',
    apiVersion: 'v1',
  },
];

const initialFilters: ResourceFilters = { name: '', label: '' };

const projectMockData: K8sResourceCommon[] = [
  {
    metadata: {
      name: 'test-proj',
      annotations: { 'openshift.io/display-name': 'My Test Project' },
    },
    kind: 'Project',
    apiVersion: 'v1',
  },
  {
    metadata: {
      name: 'other-proj',
      annotations: { 'openshift.io/display-name': 'Other Project' },
    },
    kind: 'Project',
    apiVersion: 'v1',
  },
  {
    metadata: { name: 'no-display-name' },
    kind: 'Project',
    apiVersion: 'v1',
  },
];

const createWrapper = (initialEntries: string[] = ['/']): FC<{ children: ReactNode }> => {
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
  Wrapper.displayName = 'MemoryRouterWrapper';
  return Wrapper;
};

describe('useConsoleDataViewFilters', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    useExactSearch.mockReturnValue([false, true]);
    // Suppress React warning about render-phase updates from PF's useDataViewFilters
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((msg: string) => {
      if (typeof msg === 'string' && msg.includes('Cannot update a component')) {
        // noop
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should return all data when no filters are set', () => {
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: mockData, initialFilters }),
      { wrapper: createWrapper() },
    );

    expect(result.current.filters).toEqual({ name: '', label: '' });
    expect(result.current.filteredData).toHaveLength(3);
  });

  it('should initialize filters from URL search params on mount', () => {
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: mockData, initialFilters }),
      { wrapper: createWrapper(['/?name=api']) },
    );

    expect(result.current.filters.name).toBe('api');
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.map((d) => d.metadata.name)).toEqual([
      'api-server',
      'api-gateway',
    ]);
  });

  it('should filter by name using fuzzy matching by default', () => {
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: mockData, initialFilters }),
      { wrapper: createWrapper(['/?name=front']) },
    );

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].metadata.name).toBe('web-frontend');
  });

  it('should filter by openshift.io/display-name using fuzzy matching', () => {
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: projectMockData, initialFilters }),
      { wrapper: createWrapper(['/?name=My%20Test']) },
    );

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].metadata.name).toBe('test-proj');
  });

  it('should filter by metadata.name when display name differs', () => {
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: projectMockData, initialFilters }),
      { wrapper: createWrapper(['/?name=test-proj']) },
    );

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].metadata.name).toBe('test-proj');
  });

  it('should match project by display name case-insensitively in fuzzy mode', () => {
    // Default fuzzy mode - no mock override
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: projectMockData, initialFilters }),
      { wrapper: createWrapper(['/?name=other%20project']) }, // lowercase search
    );

    // Matches "Other Project" even though we searched "other project"
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].metadata.name).toBe('other-proj');
  });

  it('should not match resources without display-name annotation when searching by display name', () => {
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: projectMockData, initialFilters }),
      { wrapper: createWrapper(['/?name=Project']) },
    );

    // "Project" appears in display names of test-proj and other-proj, but not in "no-display-name"
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.map((d) => d.metadata.name)).toEqual([
      'test-proj',
      'other-proj',
    ]);
  });

  it('should filter by openshift.io/display-name using exact matching when exact search is enabled', () => {
    useExactSearch.mockReturnValue([true, true]);

    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: projectMockData, initialFilters }),
      { wrapper: createWrapper(['/?name=My%20Test%20Project']) },
    );

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].metadata.name).toBe('test-proj');
  });

  it('should require case-sensitive match for display-name in exact search mode', () => {
    useExactSearch.mockReturnValue([true, true]);

    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: projectMockData, initialFilters }),
      { wrapper: createWrapper(['/?name=my%20test']) },
    );

    expect(result.current.filteredData).toHaveLength(0);
  });

  it('should filter by name using exact matching when exact search is enabled', () => {
    useExactSearch.mockReturnValue([true, true]);

    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: mockData, initialFilters }),
      { wrapper: createWrapper(['/?name=api']) },
    );

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.map((d) => d.metadata.name)).toEqual([
      'api-server',
      'api-gateway',
    ]);
  });

  it('should filter by label', () => {
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: mockData, initialFilters }),
      { wrapper: createWrapper(['/?label=app%3Dapi']) },
    );

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.map((d) => d.metadata.name)).toEqual([
      'api-server',
      'api-gateway',
    ]);
  });

  it('should filter by both name and label simultaneously', () => {
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: mockData, initialFilters }),
      { wrapper: createWrapper(['/?name=gateway&label=app%3Dapi']) },
    );

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].metadata.name).toBe('api-gateway');
  });

  it('should update filters and filteredData via onSetFilters', () => {
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: mockData, initialFilters }),
      { wrapper: createWrapper() },
    );

    expect(result.current.filteredData).toHaveLength(3);

    act(() => {
      result.current.onSetFilters({ name: 'web' } as ResourceFilters);
    });

    expect(result.current.filters.name).toBe('web');
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].metadata.name).toBe('web-frontend');
  });

  it('should clear all filters via clearAllFilters', () => {
    const { result } = renderHook(
      () => useConsoleDataViewFilters({ data: mockData, initialFilters }),
      { wrapper: createWrapper(['/?name=api&label=app%3Dapi']) },
    );

    expect(result.current.filteredData).toHaveLength(2);

    act(() => {
      result.current.clearAllFilters();
    });

    expect(result.current.filters.name).toBe('');
    expect(result.current.filters.label).toBe('');
    expect(result.current.filteredData).toHaveLength(3);
  });

  it('should sync filters when URL changes externally after mount', () => {
    let hookResult: {
      filters: ResourceFilters;
      onSetFilters: (filters: ResourceFilters) => void;
      clearAllFilters: () => void;
      filteredData: K8sResourceCommon[];
    };
    let navigate: ReturnType<typeof useNavigate>;

    const TestComponent = () => {
      hookResult = useConsoleDataViewFilters({ data: mockData, initialFilters });
      navigate = useNavigate();
      return null;
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestComponent />
      </MemoryRouter>,
    );

    expect(hookResult.filteredData).toHaveLength(3);

    act(() => {
      navigate('/?name=api');
    });

    expect(hookResult.filters.name).toBe('api');
    expect(hookResult.filteredData).toHaveLength(2);
    expect(hookResult.filteredData.map((d) => d.metadata.name)).toEqual([
      'api-server',
      'api-gateway',
    ]);
  });

  it('should support custom getObjectMetadata', () => {
    type CustomResource = { id: string; displayName: string };
    const customData: CustomResource[] = [
      { id: '1', displayName: 'Alpha' },
      { id: '2', displayName: 'Beta' },
    ];
    const getObjectMetadata = (obj: CustomResource) => ({
      name: obj.displayName,
      labels: undefined,
    });

    const { result } = renderHook(
      () =>
        useConsoleDataViewFilters({
          data: customData,
          initialFilters,
          getObjectMetadata,
        }),
      { wrapper: createWrapper(['/?name=alpha']) },
    );

    expect(result.current.filteredData).toHaveLength(1);
    expect((result.current.filteredData[0] as CustomResource).displayName).toBe('Alpha');
  });

  it('should support matchesAdditionalFilters', () => {
    const matchesAdditionalFilters = (_obj: K8sResourceCommon, filters: ResourceFilters) =>
      !filters.name || _obj.metadata.name.startsWith('api');

    const { result } = renderHook(
      () =>
        useConsoleDataViewFilters({
          data: mockData,
          initialFilters,
          matchesAdditionalFilters,
        }),
      { wrapper: createWrapper(['/?name=a']) },
    );

    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData.map((d) => d.metadata.name)).toEqual([
      'api-server',
      'api-gateway',
    ]);
  });

  it('should handle empty data array', () => {
    const { result } = renderHook(() => useConsoleDataViewFilters({ data: [], initialFilters }), {
      wrapper: createWrapper(['/?name=api']),
    });

    expect(result.current.filteredData).toHaveLength(0);
  });

  describe('legacy rowFilter- URL parameters', () => {
    type StatusFilters = ResourceFilters & { status: string[] };
    const statusInitialFilters: StatusFilters = { name: '', label: '', status: [] };

    let search = '';
    const locationSearch = () => search;

    const renderWithUrl = (url: string, filtersArg: any = statusInitialFilters) => {
      search = url.slice(url.indexOf('?'));
      return renderHook(
        () => {
          search = useLocation().search;
          return useConsoleDataViewFilters<K8sResourceCommon, any>({
            data: mockData,
            initialFilters: filtersArg,
          });
        },
        { wrapper: createWrapper([url]) },
      );
    };

    // The rewrite is deferred past the pagination hook's own URL write, so these await it.
    it('should adopt a legacy single-value rowFilter parameter', async () => {
      const { result } = renderWithUrl('/?rowFilter-status=Failed&page=1&perPage=50');
      await waitFor(() => expect(result.current.filters.status).toEqual(['Failed']));
    });

    it('should split a legacy comma-separated rowFilter parameter into separate values', async () => {
      const { result } = renderWithUrl('/?rowFilter-status=Failed,Succeeded');
      await waitFor(() => expect(result.current.filters.status).toEqual(['Failed', 'Succeeded']));
    });

    it('should prefer a canonical parameter over the legacy one', () => {
      const { result } = renderWithUrl('/?status=Running&rowFilter-status=Failed');
      expect(result.current.filters.status).toEqual(['Running']);
    });

    it('should ignore a legacy parameter for a filter the table does not declare', () => {
      const { result } = renderWithUrl('/?rowFilter-status=Failed', initialFilters);
      expect(result.current.filters).toEqual({ name: '', label: '' });
    });

    it('should drop the legacy parameter when a canonical one is already present', async () => {
      const { result } = renderWithUrl('/?status=Running&rowFilter-status=Failed');

      await waitFor(() => expect(locationSearch()).not.toContain('rowFilter-status'));
      expect(result.current.filters.status).toEqual(['Running']);
    });

    it('should not restore the legacy value after the canonical filter is cleared', async () => {
      const { result } = renderWithUrl('/?status=Running&rowFilter-status=Failed');

      // The stale legacy parameter has to be gone before clearing, or clearing would make it
      // adoptable again and silently re-apply the filter the user just removed.
      await waitFor(() => expect(locationSearch()).not.toContain('rowFilter-status'));

      act(() => {
        result.current.onSetFilters({ status: [] } as any);
      });

      await waitFor(() => expect(result.current.filters.status).toEqual([]));
      // Give the deferred rewrite a chance to run before asserting it stayed cleared.
      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });
      expect(result.current.filters.status).toEqual([]);
      expect(locationSearch()).not.toContain('Failed');
    });
  });
});
