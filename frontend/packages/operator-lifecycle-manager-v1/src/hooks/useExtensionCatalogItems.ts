import * as React from 'react';
import { useOLMv1Packages, SearchFilter } from './useOLMv1API';

// Convert the backend data format to what the current UI expects
const convertPackageToExtensionItem = (pkg: any, catalogName: string) => {
  return {
    id: `${catalogName}~${pkg.name}`,
    name: pkg.name,
    displayName: pkg.description || pkg.name,
    description: pkg.description || '',
    provider: '', // TODO: Extract from properties if available
    keywords: [], // TODO: Extract from properties if available
    categories: [], // TODO: Extract from properties if available
    catalog: catalogName,
    package: pkg.name,
    icon: pkg.icon,
    // Add other fields as needed for compatibility
  };
};

export const useExtensionCatalogItems = (searchFilter?: {
  keyword?: string;
  category?: string;
  provider?: string;
  // Add other filter options as needed
}) => {
  // Convert the search filter to our backend format
  const backendFilter: SearchFilter = React.useMemo(() => {
    const filter: SearchFilter = {};

    if (searchFilter?.keyword) {
      filter.keywords = searchFilter.keyword;
    }
    if (searchFilter?.category) {
      filter.category = searchFilter.category;
    }

    return filter;
  }, [searchFilter]);

  const { result, loaded, error, refetch } = useOLMv1Packages(backendFilter);

  // Convert backend response to frontend format
  const items = React.useMemo(() => {
    if (!result || !result.packages) {
      return [];
    }

    return result.packages.map((pkg) => convertPackageToExtensionItem(pkg, result.catalogName));
  }, [result]);

  return {
    items,
    loaded,
    error,
    refetch,
    totalCount: result?.totalCount || 0,
  };
};
