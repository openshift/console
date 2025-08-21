import { useMemo } from 'react';
import { useResourceDetailsPages } from './useResourceDetailsPages';

export const useResourceDetailsPage = (key: string) => {
  const detailsPages = useResourceDetailsPages();
  return useMemo(() => detailsPages.get(key), [detailsPages, key]);
};
