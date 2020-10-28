export const builderImageProvider = () =>
  import('./useBuilderImages' /* webpackChunkName: "builder-image-provider" */).then(
    (m) => m.default,
  );

export const templateProvider = () =>
  import('./useTemplates' /* webpackChunkName: "template-provider" */).then((m) => m.default);

export const serviceClassProvider = () =>
  import('./useServiceClasses' /* webpackChunkName: "service-class-provider" */).then(
    (m) => m.default,
  );

export const helmChartProvider = () =>
  import('./useHelmCharts' /* webpackChunkName: "helm-charts-provider" */).then((m) => m.default);
