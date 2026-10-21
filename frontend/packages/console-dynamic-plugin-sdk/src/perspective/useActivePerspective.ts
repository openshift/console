import { useContext } from 'react';
import type { UseActivePerspective } from '../extensions';
import type { PerspectiveContextType } from './perspective-context';
import { PerspectiveContext } from './perspective-context';

const useActivePerspective: UseActivePerspective = () => {
  const { activePerspective, setActivePerspective } = useContext<PerspectiveContextType>(
    PerspectiveContext,
  );
  return [activePerspective, setActivePerspective];
};

export default useActivePerspective;
