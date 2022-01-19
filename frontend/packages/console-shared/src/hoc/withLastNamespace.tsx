import * as React from 'react';
import { useActiveNamespace } from '../hooks';

type WithLastNamespaceProps = {
  activeNamespace?: string;
  setActiveNamespace?: (v: string) => void;
};

export const withLastNamespace = <Props extends WithLastNamespaceProps>(
  WrappedComponent: React.ComponentType<Props>,
): React.FC<Omit<Props, keyof WithLastNamespaceProps>> => {
  const Component = (props: Props) => {
    const [activeNamespace, setActiveNamespace] = useActiveNamespace();
    return (
      <WrappedComponent
        {...props}
        activeNamespace={activeNamespace}
        setActiveNamespace={setActiveNamespace}
      />
    );
  };
  Component.displayName = `withLastNamespace(${WrappedComponent.displayName ||
    WrappedComponent.name})`;
  return Component;
};
