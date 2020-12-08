import { useContext } from 'react';
import { NamespaceContext } from '@console/app/src/components/detect-namespace/namespace';

export const useActiveNamespace = (): [string, (ns: string) => void] => {
  const { namespace, setNamespace } = useContext(NamespaceContext);
  return [namespace, setNamespace];
};
