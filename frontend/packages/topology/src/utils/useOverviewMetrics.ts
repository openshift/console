// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';

export const useOverviewMetrics = () => {
  return useSelector((state: RootState) => state.UI.getIn(['overview', 'metrics']));
};
