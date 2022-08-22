import { useMemo } from 'react';
import { useResourceListPages } from './useResourceListPages';

export const useResourceListPage = (key: string) => {
  const listPages = useResourceListPages();
  return useMemo(() => listPages.get(key), [listPages, key]);
};
