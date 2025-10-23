import { useMemo } from 'react';
import {
  ResourceListPage as DynamicResourceListPage,
  isResourceListPage as isDynamicResourceListPage,
} from '@console/dynamic-plugin-sdk/src';
import { getResourceListPages } from '@console/internal/components/resource-pages';
import { isResourceListPage, ResourceListPage } from '@console/plugin-sdk/src';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';

export const useResourceListPages = () => {
  const resourceListPageExtensions = useExtensions<ResourceListPage>(isResourceListPage);
  const dynamicResourceListPageExtensions = useExtensions<DynamicResourceListPage>(
    isDynamicResourceListPage,
  );
  return useMemo(
    () => getResourceListPages(resourceListPageExtensions, dynamicResourceListPageExtensions),
    [resourceListPageExtensions, dynamicResourceListPageExtensions],
  );
};
