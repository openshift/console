import type { FC, ReactNode } from 'react';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { NamespaceContext, useValuesForNamespaceContext } from './namespace';

type DetectNamespaceProps = {
  children: ReactNode;
};

const DetectNamespace: FC<DetectNamespaceProps> = ({ children }) => {
  const { namespace, setNamespace, loaded } = useValuesForNamespaceContext();
  return loaded ? (
    <NamespaceContext.Provider value={{ namespace, setNamespace }}>
      {children}
    </NamespaceContext.Provider>
  ) : (
    <LoadingBox blame="DetectNamespace" />
  );
};

export default DetectNamespace;
