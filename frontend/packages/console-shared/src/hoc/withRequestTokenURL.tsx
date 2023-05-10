import * as React from 'react';
import { useRequestTokenURL } from '../hooks/useRequestTokenURL';

type WithRequestTokenURLProps = {
  requestTokenURL: string;
};

export const withRequestTokenURL = <Props extends WithRequestTokenURLProps>(
  WrappedComponent: React.ComponentType<Props>,
): React.FC<Omit<Props, keyof WithRequestTokenURLProps>> => {
  const Component = (props: Props) => {
    const requestTokenURL = useRequestTokenURL();
    return <WrappedComponent {...props} clusterTokenURL={requestTokenURL} />;
  };
  Component.displayName = `withRequestTokenURL(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;
  return Component;
};
