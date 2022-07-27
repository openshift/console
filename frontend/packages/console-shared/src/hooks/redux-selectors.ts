import { useSelector } from 'react-redux';

export const useActiveNamespace = (): string => {
  return useSelector(({ UI }) => UI.get('activeNamespace'));
};
