import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

export const useOverviewMetrics = () => {
  return useConsoleSelector((state) => state.UI.getIn(['overview', 'metrics']));
};
