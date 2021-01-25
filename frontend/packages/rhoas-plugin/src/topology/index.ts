export const getRhoasTopologyDataModel = () =>
  import('./rhoas-data-transformer' /* webpackChunkName: "helm-topology-components" */).then((m) =>
    m.getRhoasTopologyDataModel(),
  );

export const getRhoasComponentFactory = () =>
  import(
    './components/RhoasComponentFactory' /* webpackChunkName: "helm-topology-components" */
  ).then((m) => m.getRhoasComponentFactory());

export const getIsRhoasResource = () =>
  import('./isRhoasResource' /* webpackChunkName: "helm-topology-components" */).then(
    (m) => m.isRhoasResource,
  );

