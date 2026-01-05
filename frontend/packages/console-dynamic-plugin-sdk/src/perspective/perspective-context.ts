import type { SetStateAction, Dispatch } from 'react';
import { createContext } from 'react';
import { PerspectiveType } from '../extensions';

export type PerspectiveContextType = {
  activePerspective?: PerspectiveType;
  setActivePerspective?: Dispatch<SetStateAction<PerspectiveType>>;
};

/**
 * Creates the perspective context
 * @deprecated - use the provided `usePerspectiveContext` instead
 * @param {PerspectiveContextType} PerspectiveContextType - object with active perspective and setter
 * @returns React context
 */
export const PerspectiveContext = createContext<PerspectiveContextType>({});
