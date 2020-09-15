export const getOperatorTopologyDataModel = () =>
  import(
    './operators-data-transformer' /* webpackChunkName: "operators-topology-components" */
  ).then((m) => m.getOperatorTopologyDataModel);

export const getOperatorsComponentFactory = () =>
  import(
    './components/operatorsComponentFactory' /* webpackChunkName: "operators-topology-components" */
  ).then((m) => m.getOperatorsComponentFactory());

export const getDataModelReconciler = () =>
  import(
    './operatorsDataModelReconciler' /* webpackChunkName: "operators-topology-components" */
  ).then((m) => m.operatorsDataModelReconciler);

export const getTopologyFilters = () =>
  import('./operatorFilters' /* webpackChunkName: "operators-topology-components" */).then(
    (m) => m.getTopologyFilters,
  );

export const applyDisplayOptions = () =>
  import('./operatorFilters' /* webpackChunkName: "operators-topology-components" */).then((m) =>
    m.applyDisplayOptions(),
  );
