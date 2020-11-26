import { getExecutableCodeRef } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-utils';

export const eventSourceProvider = getExecutableCodeRef(() =>
  import('./useEventSourceProvider' /* webpackChunkName: "event-source-provider" */).then(
    (m) => m.default,
  ),
);

export const kameletsProvider = getExecutableCodeRef(() =>
  import('./useKameletsProvider' /* webpackChunkName: "kamelets-provider" */).then(
    (m) => m.default,
  ),
);
