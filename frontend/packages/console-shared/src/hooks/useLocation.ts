import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';

export const useLocation = (): string =>
  useSelector<RootState, string>(({ UI }) => UI.get('location') ?? '');
