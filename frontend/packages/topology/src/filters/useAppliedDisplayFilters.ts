// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { DisplayFilters } from '../topology-types';
import { getAppliedTopologyFilters } from './filter-utils';

const useAppliedDisplayFilters = (): DisplayFilters => {
  return useSelector((state: RootState) => getAppliedTopologyFilters(state));
};

export { useAppliedDisplayFilters };
