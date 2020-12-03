import * as React from 'react';
import { NamespaceContext, useValuesForNamespaceContext } from './namespace';

type DetectNamespaceProps = {
  children: React.ReactNode;
};

const DetectNamespace: React.FC<DetectNamespaceProps> = ({ children }) => {
  const { namespace, setNamespace, loaded } = useValuesForNamespaceContext();
  return loaded ? (
    <NamespaceContext.Provider value={{ namespace, setNamespace }}>
      {children}
    </NamespaceContext.Provider>
  ) : null;
};

export default DetectNamespace;
