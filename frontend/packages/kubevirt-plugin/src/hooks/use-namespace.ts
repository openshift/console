// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { getActiveNamespace } from '@console/internal/actions/ui';

export const useNamespace = () => {
  const activeNamespace = useSelector(getActiveNamespace);
  return activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace;
};
