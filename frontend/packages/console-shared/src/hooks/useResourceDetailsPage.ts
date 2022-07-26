import * as React from 'react';
import { useResourceDetailsPages } from './useResourceDetailsPages';

export const useResourceDetailsPage = (key: string) => {
  const detailsPages = useResourceDetailsPages();
  return React.useMemo(() => detailsPages.get(key), [detailsPages, key]);
};
