import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';

export const useActiveNamespace = (): string => {
  return useSelector<RootState, string>(({ UI }) => UI.get('activeNamespace'));
};
