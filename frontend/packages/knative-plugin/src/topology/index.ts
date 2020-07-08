export const getKnativeTopologyDataModel = () =>
  import('./data-transformer' /* webpackChunkName: "knative-components" */).then(
    (m) => m.getKnativeTopologyDataModel,
  );

export const getKnativeComponentFactory = () =>
  import(
    './components/knativeComponentFactory' /* webpackChunkName: "knative-components" */
  ).then((m) => m.getKnativeComponentFactory());

export const getIsKnativeResource = () =>
  import('./isKnativeResource' /* webpackChunkName: "knative-components" */).then(
    (m) => m.isKnativeResource,
  );

export const getTopologyFilters = () =>
  import('./knativeFilters' /* webpackChunkName: "knative-components" */).then(
    (m) => m.getTopologyFilters,
  );

export const applyDisplayOptions = () =>
  import('./knativeFilters' /* webpackChunkName: "knative-components" */).then((m) =>
    m.applyDisplayOptions(),
  );

export const getCreateConnector = () =>
  import('./knative-topology-utils' /* webpackChunkName: "knative-create-connector" */).then(
    (m) => m.getCreateConnector,
  );
