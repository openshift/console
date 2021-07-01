import { Dispatch, SetStateAction, useContext } from 'react';
import {
  PerpsectiveContext,
  PerspectiveContextType,
  PerspectiveType,
} from '@console/app/src/components/detect-perspective/perspective-context';
import { USERSETTINGS_PREFIX } from '@console/dynamic-plugin-sdk';

const PERSPECTIVE_VISITED_FEATURE_KEY = 'perspective.visited';

export const getPerspectiveVisitedKey = (perspective: PerspectiveType): string =>
  `${USERSETTINGS_PREFIX}.${PERSPECTIVE_VISITED_FEATURE_KEY}.${perspective}`;

export const useActivePerspective = (): [
  PerspectiveType,
  Dispatch<SetStateAction<PerspectiveType>>,
] => {
  const { activePerspective, setActivePerspective } = useContext<PerspectiveContextType>(
    PerpsectiveContext,
  );
  return [activePerspective, setActivePerspective];
};
