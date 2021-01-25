export const getRhoasTopologyDataModel = () =>
  import('./rhoas-data-transformer' /* webpackChunkName: "rhoas-topology-components" */).then((m) =>
    m.getRhoasTopologyDataModel(),
  );

export const getRhoasComponentFactory = () =>
  import(
    './components/RhoasComponentFactory' /* webpackChunkName: "rhoas-topology-components" */
  ).then((m) => m.getRhoasComponentFactory());
