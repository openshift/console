export const getHelmTopologyDataModel = () =>
  import('./helm-data-transformer' /* webpackChunkName: "helm-topology-components" */).then((m) =>
    m.getHelmTopologyDataModel(),
  );

export const getHelmComponentFactory = () =>
  import(
    './components/helmComponentFactory' /* webpackChunkName: "helm-topology-components" */
  ).then((m) => m.getHelmComponentFactory());

export const getIsHelmResource = () =>
  import('./isHelmResource' /* webpackChunkName: "helm-topology-components" */).then(
    (m) => m.isHelmResourceInModel,
  );

export const getTopologyFilters = () =>
  import('./helmFilters' /* webpackChunkName: "helm-topology-components" */).then(
    (m) => m.getTopologyFilters,
  );

export const applyDisplayOptions = () =>
  import('./helmFilters' /* webpackChunkName: "helm-topology-components" */).then((m) =>
    m.applyDisplayOptions(),
  );
