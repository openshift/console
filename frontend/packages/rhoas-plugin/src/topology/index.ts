export const getRhoasTopologyDataModel = () =>
  // eslint-disable-next-line import/no-cycle
  import('./rhoas-data-transformer' /* webpackChunkName: "rhoas-topology-components" */).then((m) =>
    m.getRhoasTopologyDataModel(),
  );

export const getRhoasComponentFactory = () =>
  // eslint-disable-next-line import/no-cycle
  import(
    './components/rhoasComponentFactory' /* webpackChunkName: "rhoas-topology-components" */
  ).then((m) => m.getRhoasComponentFactory());
