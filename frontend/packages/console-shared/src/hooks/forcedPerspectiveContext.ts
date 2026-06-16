import { createContext, useContext } from 'react';
import type { ForcedPerspectiveResult } from '../utils/forcedPerspective';

export const ForcedPerspectiveContext = createContext<ForcedPerspectiveResult | null>(null);

/** Reads the forced perspective from DetectContext. Avoids duplicate useForcedPerspective calls. */
export const useForcedPerspectiveContext = (): ForcedPerspectiveResult => {
  const context = useContext(ForcedPerspectiveContext);
  if (!context) {
    throw new Error(
      'useForcedPerspectiveContext must be used within ForcedPerspectiveContext.Provider',
    );
  }
  return context;
};
