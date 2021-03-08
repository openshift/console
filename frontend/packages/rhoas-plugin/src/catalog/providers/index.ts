import { getExecutableCodeRef } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-utils';

export const rhoasProvider = getExecutableCodeRef(() => {
  // eslint-disable-next-line import/no-cycle
  return import('./useRhoasCatalog' /* webpackChunkName: "rhoasProvider-provider" */).then(
    (m) => m.default,
  );
});
