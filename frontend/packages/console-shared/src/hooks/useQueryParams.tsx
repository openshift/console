import type { ComponentType, FC } from 'react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

export const useQueryParams = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

export type WithQueryParamsProps = {
  queryParams: URLSearchParams;
};

export const withQueryParams = <Props extends WithQueryParamsProps>(
  Component: ComponentType<Props>,
): FC<Omit<Props, keyof WithQueryParamsProps>> => (props: Props) => {
  const queryParams = useQueryParams();
  return <Component {...props} queryParams={queryParams} />;
};
