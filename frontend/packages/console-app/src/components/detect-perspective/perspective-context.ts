import * as React from 'react';

export type PerspectiveType = string;

export type PerspectiveContextType = {
  activePerspective?: PerspectiveType;
  setActivePerspective?: React.Dispatch<React.SetStateAction<PerspectiveType>>;
};

export const PerpsectiveContext = React.createContext<PerspectiveContextType>({});
