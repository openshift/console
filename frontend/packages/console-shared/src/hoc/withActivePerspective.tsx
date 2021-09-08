import * as React from 'react';
import { PerspectiveType, useActivePerspective } from '@console/dynamic-plugin-sdk';

type WithActivePerspectiveProps = {
  activePerspective?: PerspectiveType;
  setActivePerspective?: React.Dispatch<React.SetStateAction<PerspectiveType>>;
};

export const withActivePerspective = <Props extends WithActivePerspectiveProps>(
  Component: React.ComponentType<Props>,
): React.FC<Omit<Props, keyof WithActivePerspectiveProps>> => (props: Props) => {
  const [activePerspective, setActivePerspective] = useActivePerspective();
  return (
    <Component
      {...props}
      activePerspective={activePerspective}
      setActivePerspective={setActivePerspective}
    />
  );
};
