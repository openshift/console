export const getDataModelReconciler = () =>
  import(
    './getPipelinesDataModelReconciler' /* webpackChunkName: "operators-topology-components" */
  ).then((m) => m.getPipelinesDataModelReconciler);

export * from './pipeline-tab-section';
