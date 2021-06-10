export const getServiceRouteDecorator = () =>
  import('./getServiceRouteDecorator' /* webpackChunkName: "knative-components" */).then(
    (m) => m.getServiceRouteDecorator,
  );

export const getRevisionRouteDecorator = () =>
  import('./getRevisionRouteDecorator' /* webpackChunkName: "revision-decorator" */).then(
    (m) => m.getRevisionRouteDecorator,
  );
