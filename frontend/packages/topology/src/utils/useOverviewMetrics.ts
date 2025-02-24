import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';

export const useOverviewMetrics = () => {
  return useSelector((state: RootState) => state.UI.getIn(['overview', 'metrics']));
};
