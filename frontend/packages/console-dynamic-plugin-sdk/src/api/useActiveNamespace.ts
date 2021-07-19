import { createContext, useContext } from 'react';

type NamespaceContextType = {
  namespace?: string;
  setNamespace?: (ns: string) => void;
};

export const NamespaceContext = createContext<NamespaceContextType>({});

export const useActiveNamespace = (): [string, (ns: string) => void] => {
  const { namespace, setNamespace } = useContext(NamespaceContext);
  return [namespace, setNamespace];
};
