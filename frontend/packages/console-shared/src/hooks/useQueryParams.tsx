import * as React from 'react';
import { useLocation } from 'react-router-dom';

export const useQueryParams = () => {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
};

export type WithQueryParamsProps = {
  queryParams: URLSearchParams;
};

export const withQueryParams = <Props extends WithQueryParamsProps>(
  Component: React.ComponentType<Props>,
): React.FC<Omit<Props, keyof WithQueryParamsProps>> => (props: Props) => {
  const queryParams = useQueryParams();
  return <Component {...props} queryParams={queryParams} />;
};
