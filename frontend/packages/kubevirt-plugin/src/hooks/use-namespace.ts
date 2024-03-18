import { useSelector } from 'react-redux';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { ALL_NAMESPACES_KEY } from '../constants';

export const useNamespace = () => {
  const activeNamespace = useSelector(getActiveNamespace);
  return activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace;
};
