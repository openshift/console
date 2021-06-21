export const getRhoasTopologyDataModel = () =>
  import(
    './rhoas-data-transformer' /* webpackChunkName: "rhoas-topology-data-transformer" */
  ).then((m) => m.getRhoasTopologyDataModel());

export const getRhoasComponentFactory = () =>
  import(
    './components/rhoasComponentFactory' /* webpackChunkName: "rhoas-topology-component-factory" */
  ).then((m) => m.getRhoasComponentFactory);
