import * as React from 'react';
import { useActiveNamespace } from '../hooks';

type WithLastNamespaceProps = {
  activeNamespace?: string;
  setActiveNamespace?: (v: string) => void;
};

export const withLastNamespace = <Props extends WithLastNamespaceProps>(
  WrappedComponent: React.ComponentType<Props>,
): React.FC<Omit<Props, keyof WithLastNamespaceProps>> => (props: Props) => {
  const [activeNamespace, setActiveNamespace] = useActiveNamespace();
  return (
    <WrappedComponent
      {...props}
      activeNamespace={activeNamespace}
      setActiveNamespace={setActiveNamespace}
    />
  );
};
