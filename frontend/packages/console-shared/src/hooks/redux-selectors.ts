// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';

export const useActiveNamespace = (): string => {
  return useSelector(({ UI }) => UI.get('activeNamespace'));
};
