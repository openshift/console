// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { DisplayFilters } from './filter-types';
import { getTopologyFilters } from './filter-utils';

const useDisplayFilters = (): DisplayFilters => {
  return useSelector((state: RootState) => getTopologyFilters(state).display);
};

export { useDisplayFilters };
