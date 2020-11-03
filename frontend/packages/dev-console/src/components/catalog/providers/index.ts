import { getExecutableCodeRef } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-utils';

export const builderImageProvider = getExecutableCodeRef(() =>
  import('./useBuilderImages' /* webpackChunkName: "builder-image-provider" */).then(
    (m) => m.default,
  ),
);

export const templateProvider = getExecutableCodeRef(() =>
  import('./useTemplates' /* webpackChunkName: "template-provider" */).then((m) => m.default),
);

export const helmChartProvider = getExecutableCodeRef(() =>
  import('./useHelmCharts' /* webpackChunkName: "helm-charts-provider" */).then((m) => m.default),
);
