import { useMemo } from 'react';
import type { ResourceListPage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { isResourceListPage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { getResourceListPages } from '@console/internal/components/resource-pages';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';

export const useResourceListPages = () => {
  const resourceListPageExtensions = useExtensions<ResourceListPage>(isResourceListPage);
  return useMemo(() => getResourceListPages(resourceListPageExtensions), [
    resourceListPageExtensions,
  ]);
};
