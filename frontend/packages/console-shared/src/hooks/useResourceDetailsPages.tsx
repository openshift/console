import { useMemo } from 'react';
import {
  ResourceDetailsPage,
  isResourceDetailsPage,
} from '@console/dynamic-plugin-sdk/src/extensions/pages';
import { getResourceDetailsPages } from '@console/internal/components/resource-pages';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';

export const useResourceDetailsPages = () => {
  const resourceDetailsPageExtensions = useExtensions<ResourceDetailsPage>(isResourceDetailsPage);
  return useMemo(() => getResourceDetailsPages(resourceDetailsPageExtensions), [
    resourceDetailsPageExtensions,
  ]);
};
