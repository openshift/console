// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useSelector } from 'react-redux';

export const useActiveNamespace = (): string => {
  return useSelector(({ UI }) => UI.get('activeNamespace'));
};
