import { useEffect, useState } from 'react';
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

// Fetch lifecycle data and deduplicate concurrent requests via a module-level cache.
// Requests are intentionally not cancelled on component unmount: the response
// populates the cache so any later render of the same operator avoids a re-fetch,
// and React silently ignores state updates after unmount.
const fetchLifecycleData = (cacheKey: string, url: string): Promise<LifecycleData> => {
  const existing = lifecycleCache.get(cacheKey);
  if (existing?.promise) {
    return existing.promise; // deduplicate: all callers share the one in-flight request
  }

  const promise = coFetchJSON(url, 'GET', {}).then(
    (result: LifecycleData) => {
      lifecycleCache.set(cacheKey, { data: result, error: null, timestamp: Date.now() });
      return result;
    },
    (err: Error) => {
      lifecycleCache.set(cacheKey, { data: null, error: err, timestamp: Date.now() });
      throw err;
    },
  );

  lifecycleCache.set(cacheKey, { data: null, error: null, timestamp: Date.now(), promise });
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

  useEffect(() => {
    if (!packageName || !catalogName || !catalogNamespace) {
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

    let active = true;
    setLoading(true);

    const url = `/api/olm/lifecycle/${encodeURIComponent(catalogNamespace)}/${encodeURIComponent(
      catalogName,
    )}/${encodeURIComponent(packageName)}`;

    fetchLifecycleData(cacheKey, url)
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setData(null);
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      active = false;
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
