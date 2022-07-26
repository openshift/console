import * as React from 'react';
import {
  ResourceListPage as DynamicResourceListPage,
  isResourceListPage as isDynamicResourceListPage,
} from '@console/dynamic-plugin-sdk/src';
import { getResourceListPages } from '@console/internal/components/resource-pages';
import { isResourceListPage, ResourceListPage, useExtensions } from '@console/plugin-sdk/src';

export const useResourceListPages = () => {
  const resourceListPageExtensions = useExtensions<ResourceListPage>(isResourceListPage);
  const dynamicResourceListPageExtensions = useExtensions<DynamicResourceListPage>(
    isDynamicResourceListPage,
  );
  return React.useMemo(
    () => getResourceListPages(resourceListPageExtensions, dynamicResourceListPageExtensions),
    [resourceListPageExtensions, dynamicResourceListPageExtensions],
  );
};
