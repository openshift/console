import * as React from 'react';

/**
 * React hook that forces component render.
 */
export const useForceRender = () => React.useReducer((s: boolean) => !s, false)[1] as VoidFunction;
