export const getRhoasTopologyDataModel = () =>
  import('./rhoas-data-transformer' /* webpackChunkName: "rhoas-topology-components" */).then((m) =>
    m.getRhoasTopologyDataModel(),
  );

export const getRhoasComponentFactory = () =>
  import(
    './components/rhoasComponentFactory' /* webpackChunkName: "rhoas-topology-components" */
  ).then((m) => m.getRhoasComponentFactory());
