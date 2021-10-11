import * as React from 'react';
import { PerspectiveType } from '../extensions';

export type PerspectiveContextType = {
  activePerspective?: PerspectiveType;
  setActivePerspective?: React.Dispatch<React.SetStateAction<PerspectiveType>>;
};

export const PerspectiveContext = React.createContext<PerspectiveContextType>({});
