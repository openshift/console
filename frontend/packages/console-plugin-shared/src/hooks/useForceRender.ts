import { useReducer } from 'react';

/**
 * React hook that forces component render.
 */
export const useForceRender = () => useReducer((s: boolean) => !s, false)[1] as VoidFunction;
