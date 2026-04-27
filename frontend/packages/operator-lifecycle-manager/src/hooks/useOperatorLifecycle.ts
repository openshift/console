import { useEffect, useRef, useState } from 'react';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import type { LifecycleData } from '../components/operator-lifecycle-status';
import { DEFAULT_SOURCE_NAMESPACE } from '../const';
import type { ClusterServiceVersionKind, SubscriptionKind } from '../types';

const CACHE_TTL_SUCCESS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_ERROR = 30 * 1000; // 30 seconds

type LifecycleCacheEntry = {
  data: LifecycleData | null;
  error: Error | null;
  timestamp: number;
  promise?: Promise<LifecycleData>;
};

const lifecycleCache = new Map<string, LifecycleCacheEntry>();

const buildCacheKey = (catalogNamespace: string, catalogName: string, packageName: string) =>
  `${catalogNamespace}/${catalogName}/${packageName}`;

const isCacheValid = (entry: LifecycleCacheEntry): boolean => {
  if (entry.promise) {
    return true;
  }
  const age = Date.now() - entry.timestamp;
  const ttl = entry.error ? CACHE_TTL_ERROR : CACHE_TTL_SUCCESS;
  return age < ttl;
};

const extractPackageName = (olmProperties: string): string | undefined => {
  try {
    const props = JSON.parse(olmProperties);
    const packageProp = props.find(
      (p: { type: string; value: { packageName?: string } }) =>
        p.type === 'olm.package' && p.value?.packageName,
    );
    return packageProp?.value?.packageName;
  } catch {
    return undefined;
  }
};

const fetchLifecycleData = (
  cacheKey: string,
  url: string,
  signal: AbortSignal,
): Promise<LifecycleData> => {
  const existing = lifecycleCache.get(cacheKey);
  if (existing?.promise) {
    return existing.promise;
  }

  const promise = coFetchJSON(url, 'GET', { signal }).then(
    (result: LifecycleData) => {
      lifecycleCache.set(cacheKey, {
        data: result,
        error: null,
        timestamp: Date.now(),
      });
      return result;
    },
    (err: Error) => {
      lifecycleCache.set(cacheKey, {
        data: null,
        error: err,
        timestamp: Date.now(),
      });
      throw err;
    },
  );

  lifecycleCache.set(cacheKey, {
    data: null,
    error: null,
    timestamp: Date.now(),
    promise,
  });

  return promise;
};

export const useOperatorLifecycle = (
  packageName: string | undefined,
  catalogName: string | undefined,
  catalogNamespace: string | undefined,
): [LifecycleData | null, boolean, Error | null] => {
  const [data, setData] = useState<LifecycleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController>();

  // eslint-disable-next-line no-console
  console.log('[lifecycle-hook] useOperatorLifecycle called:', {
    packageName,
    catalogName,
    catalogNamespace,
  });

  useEffect(() => {
    if (!packageName || !catalogName || !catalogNamespace) {
      // eslint-disable-next-line no-console
      console.log('[lifecycle-hook] Skipping fetch — missing params:', {
        packageName,
        catalogName,
        catalogNamespace,
      });
      setData(null);
      setLoading(false);
      return undefined;
    }

    const cacheKey = buildCacheKey(catalogNamespace, catalogName, packageName);
    const cached = lifecycleCache.get(cacheKey);
    if (cached && isCacheValid(cached) && !cached.promise) {
      setData(cached.data);
      setError(cached.error);
      setLoading(false);
      return undefined;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    const url = `/api/olm/lifecycle/${encodeURIComponent(catalogNamespace)}/${encodeURIComponent(
      catalogName,
    )}/${encodeURIComponent(packageName)}`;

    // eslint-disable-next-line no-console
    console.log('[lifecycle-hook] Fetching:', url);

    fetchLifecycleData(cacheKey, url, controller.signal)
      .then((result) => {
        // eslint-disable-next-line no-console
        console.log('[lifecycle-hook] Fetch success:', url, result);
        if (!controller.signal.aborted) {
          setData(result);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        // eslint-disable-next-line no-console
        console.error('[lifecycle-hook] Fetch error:', url, err);
        if (!controller.signal.aborted) {
          setData(null);
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [packageName, catalogName, catalogNamespace]);

  return [data, loading, error];
};

export const getLifecycleInfoFromSubscription = (
  subscription: SubscriptionKind | undefined,
): { catalogName: string | undefined; catalogNamespace: string | undefined } => {
  return {
    catalogName: subscription?.spec?.source,
    catalogNamespace: subscription?.spec?.sourceNamespace ?? DEFAULT_SOURCE_NAMESPACE,
  };
};

export const getPackageNameFromCSV = (
  csv: ClusterServiceVersionKind,
  subscription?: SubscriptionKind,
): string | undefined => {
  if (subscription?.spec?.name) {
    return subscription.spec.name;
  }
  if (csv?.metadata?.annotations?.['olm.properties']) {
    return extractPackageName(csv.metadata.annotations['olm.properties']);
  }
  return undefined;
};

export const getClusterVersion = (): string | undefined => {
  return window.SERVER_FLAGS?.releaseVersion;
};
