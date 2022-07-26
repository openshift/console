import * as React from 'react';
import {
  ResourceDetailsPage as DynamicResourceDetailsPage,
  isResourceDetailsPage as isDynamicResourceDetailsPage,
} from '@console/dynamic-plugin-sdk/src';
import { getResourceDetailsPages } from '@console/internal/components/resource-pages';
import { isResourceDetailsPage, ResourceDetailsPage, useExtensions } from '@console/plugin-sdk/src';

export const useResourceDetailsPages = () => {
  const resourceDetailsPageExtensions = useExtensions<ResourceDetailsPage>(isResourceDetailsPage);
  const dynamicResourceDetailsPageExtensions = useExtensions<DynamicResourceDetailsPage>(
    isDynamicResourceDetailsPage,
  );
  return React.useMemo(
    () =>
      getResourceDetailsPages(resourceDetailsPageExtensions, dynamicResourceDetailsPageExtensions),
    [resourceDetailsPageExtensions, dynamicResourceDetailsPageExtensions],
  );
};
