import { useContext } from 'react';
import { UseActivePerspective } from '../extensions';
import { PerspectiveContext, PerspectiveContextType } from './perspective-context';

const useActivePerspective: UseActivePerspective = () => {
  const { activePerspective, setActivePerspective } = useContext<PerspectiveContextType>(
    PerspectiveContext,
  );
  return [activePerspective, setActivePerspective];
};

export default useActivePerspective;
