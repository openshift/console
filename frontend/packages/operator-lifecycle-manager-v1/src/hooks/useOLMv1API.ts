import * as React from 'react';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { coFetchJSON } from '@console/internal/co-fetch';
import { CLUSTER_CATALOG_GROUP_VERSION_KIND } from '../const';

// Types for backend API responses
export interface CatalogData {
  catalogName: string;
  baseURL: string;
  lastUpdated: string;
  objectCount: number;
}

export interface PackageData {
  name: string;
  description: string;
  icon?: any;
  channels: { [channelName: string]: ChannelData };
}

export interface ChannelData {
  name: string;
  bundles: { [bundleName: string]: BundleData };
}

export interface BundleData {
  name: string;
  image: string;
  // Add other bundle fields as needed
}

export interface SearchFilter {
  packageName?: string;
  channel?: string;
  keywords?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  packages: PackageData[];
  totalCount: number;
  limit: number;
  offset: number;
  catalogName: string;
}

// Custom hook to fetch catalog list
export const useOLMv1Catalogs = () => {
  const [catalogs, setCatalogs] = React.useState<CatalogData[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchCatalogs = React.useCallback(async () => {
    try {
      setError(null);
      const response = await coFetchJSON('/api/olmv1/catalogs');
      setCatalogs(response.catalogs || []);
      setLoaded(true);
    } catch (err) {
      setError(err);
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  return { catalogs, loaded, error, refetch: fetchCatalogs };
};

// Custom hook to search packages
export const useOLMv1Packages = (filter?: SearchFilter) => {
  const [result, setResult] = React.useState<SearchResult | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchPackages = React.useCallback(async (searchFilter?: SearchFilter) => {
    try {
      setError(null);
      setLoaded(false);

      const params = new URLSearchParams();
      if (searchFilter?.packageName) params.append('packageName', searchFilter.packageName);
      if (searchFilter?.channel) params.append('channel', searchFilter.channel);
      if (searchFilter?.keywords) params.append('keywords', searchFilter.keywords);
      if (searchFilter?.category) params.append('category', searchFilter.category);
      if (searchFilter?.limit) params.append('limit', searchFilter.limit.toString());
      if (searchFilter?.offset) params.append('offset', searchFilter.offset.toString());

      const url = `/api/olmv1/packages${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await coFetchJSON(url);
      setResult(response);
      setLoaded(true);
    } catch (err) {
      setError(err);
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    fetchPackages(filter);
  }, [fetchPackages, filter]);

  return { result, loaded, error, refetch: () => fetchPackages(filter) };
};

// Custom hook to fetch channels for a package
export const useOLMv1Channels = (packageName?: string) => {
  const [channels, setChannels] = React.useState<ChannelData[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchChannels = React.useCallback(async (pkgName?: string) => {
    if (!pkgName) {
      setChannels([]);
      setLoaded(true);
      return;
    }

    try {
      setError(null);
      setLoaded(false);
      const response = await coFetchJSON(`/api/olmv1/channels/${encodeURIComponent(pkgName)}`);
      setChannels(response.channels || []);
      setLoaded(true);
    } catch (err) {
      setError(err);
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    fetchChannels(packageName);
  }, [fetchChannels, packageName]);

  return { channels, loaded, error, refetch: () => fetchChannels(packageName) };
};

// Custom hook to fetch bundles for a package and channel
export const useOLMv1Bundles = (packageName?: string, channelName?: string) => {
  const [bundles, setBundles] = React.useState<BundleData[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchBundles = React.useCallback(async (pkgName?: string, chName?: string) => {
    if (!pkgName || !chName) {
      setBundles([]);
      setLoaded(true);
      return;
    }

    try {
      setError(null);
      setLoaded(false);
      const response = await coFetchJSON(
        `/api/olmv1/bundles/${encodeURIComponent(pkgName)}/${encodeURIComponent(chName)}`,
      );
      setBundles(response.bundles || []);
      setLoaded(true);
    } catch (err) {
      setError(err);
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    fetchBundles(packageName, channelName);
  }, [fetchBundles, packageName, channelName]);

  return { bundles, loaded, error, refetch: () => fetchBundles(packageName, channelName) };
};

// Custom hook to get OLMv1 status
export const useOLMv1Status = () => {
  const [status, setStatus] = React.useState<any>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchStatus = React.useCallback(async () => {
    try {
      setError(null);
      const response = await coFetchJSON('/api/olmv1/status');
      setStatus(response);
      setLoaded(true);
    } catch (err) {
      setError(err);
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loaded, error, refetch: fetchStatus };
};

// Watch ClusterCatalog resources and trigger refetch when they change
export const useOLMv1AutoRefresh = (onCatalogChange?: () => void) => {
  const [catalogs] = useK8sWatchResource<any[]>({
    groupVersionKind: CLUSTER_CATALOG_GROUP_VERSION_KIND,
    isList: true,
  });

  const prevCatalogsRef = React.useRef<any[]>();

  React.useEffect(() => {
    // Check if catalogs have actually changed (not just re-rendered)
    if (
      prevCatalogsRef.current &&
      JSON.stringify(prevCatalogsRef.current) !== JSON.stringify(catalogs)
    ) {
      onCatalogChange?.();
    }
    prevCatalogsRef.current = catalogs;
  }, [catalogs, onCatalogChange]);

  return catalogs;
};
