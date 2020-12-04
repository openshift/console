import { Dispatch, SetStateAction, useContext } from 'react';
import {
  PerpsectiveContext,
  PerspectiveContextType,
  PerspectiveType,
} from '@console/app/src/components/detect-perspective/perspective-context';

export const useActivePerspective = (): [
  PerspectiveType,
  Dispatch<SetStateAction<PerspectiveType>>,
] => {
  const { activePerspective, setActivePerspective } = useContext<PerspectiveContextType>(
    PerpsectiveContext,
  );
  return [activePerspective, setActivePerspective];
};
