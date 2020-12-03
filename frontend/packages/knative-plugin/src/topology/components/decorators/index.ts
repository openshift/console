export const getServiceRouteDecorator = () =>
  import('./getServiceRouteDecorator' /* webpackChunkName: "knative-components" */).then(
    (m) => m.getServiceRouteDecorator,
  );
