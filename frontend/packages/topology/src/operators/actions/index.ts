export const getCreateConnector = () =>
  import('./serviceBindings' /* webpackChunkName: "operators-service-bindings" */).then(
    (m) => m.getCreateConnector,
  );
