import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDataViewFilters } from '@patternfly/react-data-view';
import { useSearchParams } from 'react-router';
import { useExactSearch } from '@console/app/src/components/user-preferences/search/useExactSearch';
import type {
  K8sResourceCommon,
  ResourceFilters,
  ResourceMetadata,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  exactMatch,
  fuzzyCaseInsensitive,
} from '@console/internal/components/factory/table-filters';
import { mapLabelsToStrings } from '@console/shared/src/utils/label-filter';

const getK8sResourceMetadata = (obj: K8sResourceCommon): ResourceMetadata => ({
  name: obj.metadata?.name,
  labels: obj.metadata?.labels,
});

const getOpenShiftDisplayName = (resource: K8sResourceCommon): string | undefined =>
  resource.metadata?.annotations?.['openshift.io/display-name'];

/** @see storagePrefix in `@console/internal/components/row-filter` */
const LEGACY_ROW_FILTER_PREFIX = 'rowFilter-';

/**
 * Rewrites row filters left in the URL by the legacy `FilterToolbar` into the form DataView reads.
 *
 * `FilterToolbar` wrote one `rowFilter-<id>` parameter holding comma-separated values, where
 * DataView repeats `<id>` once per value. Without this, a bookmark or a link shared before a list
 * page moved to `ConsoleDataView` still loads, but silently drops its filters.
 *
 * Only filters the table declares are touched, so this cannot invent parameters. A canonical
 * parameter already present wins, since that one came from the current UI, but the legacy
 * parameter is dropped either way. Leaving it in place would let it resurrect the filter the
 * moment the user clears it, because clearing removes the canonical parameter and would make the
 * stale legacy one adoptable again.
 *
 * The rewrite is deferred to a later task rather than run inline. `useDataViewPagination` writes
 * `page` and `perPage` during the same commit, from the snapshot it captured before this runs, so
 * an inline rewrite is discarded and nothing changes the URL afterwards to trigger a retry.
 */
const useLegacyRowFilterParams = (
  filterIds: string[],
  searchParams: URLSearchParams,
  setSearchParams: ReturnType<typeof useSearchParams>[1],
) => {
  const legacy = useMemo(
    () =>
      filterIds
        .map((id) => ({
          id,
          value: searchParams.get(`${LEGACY_ROW_FILTER_PREFIX}${id}`),
          adopt: !searchParams.has(id),
        }))
        .filter(({ value }) => value !== null),
    [filterIds, searchParams],
  );

  const rewrite = useCallback(
    (prev: URLSearchParams) => {
      const next = new URLSearchParams(prev);
      legacy.forEach(({ id, value, adopt }) => {
        next.delete(`${LEGACY_ROW_FILTER_PREFIX}${id}`);
        if (adopt) {
          value
            .split(',')
            .filter(Boolean)
            .forEach((entry) => next.append(id, entry));
        }
      });
      return next;
    },
    [legacy],
  );

  useEffect(() => {
    if (legacy.length === 0) {
      return undefined;
    }
    const timeout = setTimeout(() => setSearchParams(rewrite, { replace: true }));
    return () => clearTimeout(timeout);
  }, [legacy, rewrite, setSearchParams]);
};

export const useConsoleDataViewFilters = <
  TData,
  TFilters extends ResourceFilters = ResourceFilters,
>({
  data,
  initialFilters,
  getObjectMetadata = getK8sResourceMetadata,
  matchesAdditionalFilters,
}: {
  data: TData[];
  initialFilters: TFilters;
  getObjectMetadata?: (obj: TData) => ResourceMetadata;
  matchesAdditionalFilters?: (obj: TData, filters: TFilters) => boolean;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExactSearch] = useExactSearch();

  const filterIds = useMemo(() => Object.keys(initialFilters), [initialFilters]);
  useLegacyRowFilterParams(filterIds, searchParams, setSearchParams);

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<TFilters>({
    initialFilters,
    searchParams,
    setSearchParams,
  });

  // Sync URL search params → internal filter state.
  // useDataViewFilters only reads searchParams on mount (empty deps useEffect).
  // This effect ensures filters stay in sync when the URL changes externally
  // (e.g., the Search page updating query params without remounting).
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  });
  useEffect(() => {
    const updates: Partial<TFilters> = {};
    let hasChanges = false;
    for (const key of Object.keys(filtersRef.current)) {
      const currentValue = filtersRef.current[key];
      if (Array.isArray(currentValue)) {
        const urlValues = searchParams.getAll(key);
        if (
          urlValues.length !== currentValue.length ||
          urlValues.some((v, i) => v !== currentValue[i])
        ) {
          updates[key] = urlValues;
          hasChanges = true;
        }
      } else {
        const urlValue = searchParams.get(key) ?? '';
        if (urlValue !== currentValue) {
          updates[key] = urlValue;
          hasChanges = true;
        }
      }
    }
    if (hasChanges) {
      onSetFilters(updates as TFilters);
    }
  }, [searchParams, onSetFilters]);

  const filteredData = useMemo(
    () =>
      data?.filter((resource) => {
        const { name: resourceName, labels } = getObjectMetadata(resource);
        const displayName = getOpenShiftDisplayName(resource as K8sResourceCommon);

        // Filter by K8s resource name or display name
        const matchFn = isExactSearch ? exactMatch : fuzzyCaseInsensitive;
        const matchesName =
          !filters.name ||
          matchFn(filters.name, resourceName) ||
          matchFn(filters.name, displayName);

        const resourceLabels = mapLabelsToStrings(labels);
        const filterLabelsArray = filters.label?.split(',') ?? [];

        // Filter by K8s resource labels
        const matchesLabels =
          !filters.label || filterLabelsArray.every((label) => resourceLabels.includes(label));

        return (
          matchesName && matchesLabels && (matchesAdditionalFilters?.(resource, filters) ?? true)
        );
      }) ?? [],
    [data, filters, isExactSearch, getObjectMetadata, matchesAdditionalFilters],
  );

  return { filters, onSetFilters, clearAllFilters, filteredData };
};
