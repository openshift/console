// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { DisplayFilters } from '../topology-types';
import { getTopologyFilters } from './filter-utils';
import { useDeepCompareMemoize } from '@console/shared/src';

const useDisplayFilters = (): DisplayFilters => {
  const filters = useSelector((state: RootState) => getTopologyFilters(state));
  return useDeepCompareMemoize(filters);
};

export { useDisplayFilters };
