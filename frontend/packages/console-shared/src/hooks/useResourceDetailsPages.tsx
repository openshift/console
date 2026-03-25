import { useMemo } from 'react';
import type { ResourceDetailsPage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { isResourceDetailsPage } from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { getResourceDetailsPages } from '@console/internal/components/resource-pages';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';

export const useResourceDetailsPages = () => {
  const resourceDetailsPageExtensions = useExtensions<ResourceDetailsPage>(isResourceDetailsPage);
  return useMemo(() => getResourceDetailsPages(resourceDetailsPageExtensions), [
    resourceDetailsPageExtensions,
  ]);
};
