export const getPipelineRunDecorator = () =>
  import('./getPipelineRunDecorator' /* webpackChunkName: "pipelines-topology-components" */).then(
    (m) => m.getPipelineRunDecorator,
  );
