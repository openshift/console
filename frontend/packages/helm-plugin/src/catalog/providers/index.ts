import { getExecutableCodeRef } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-utils';

export const helmChartProvider = getExecutableCodeRef(() =>
  import('./useHelmCharts' /* webpackChunkName: "helm-charts-provider" */).then((m) => m.default),
);
