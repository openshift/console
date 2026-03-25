import type { SetStateAction, Dispatch, ComponentType, FC } from 'react';
import type { PerspectiveType } from '@console/dynamic-plugin-sdk';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';

type WithActivePerspectiveProps = {
  activePerspective?: PerspectiveType;
  setActivePerspective?: Dispatch<SetStateAction<PerspectiveType>>;
};

export const withActivePerspective = <Props extends WithActivePerspectiveProps>(
  Component: ComponentType<Props>,
): FC<Omit<Props, keyof WithActivePerspectiveProps>> => (props: Props) => {
  const [activePerspective, setActivePerspective] = useActivePerspective();
  return (
    <Component
      {...props}
      activePerspective={activePerspective}
      setActivePerspective={setActivePerspective}
    />
  );
};
