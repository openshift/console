import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';

export { useDetectHelmChartRepositories } from './helm-detection-provider';

export const helmChartRepositoriesBreadcrumbsProvider = applyCodeRefSymbol(() =>
  import(
    './useHelmChartRepositoriesBreadcrumbs' /* webpackChunkName: "helmchart-breadcrumbs-provider" */
  ).then((m) => m.useHelmChartRepositoriesBreadcrumbs),
);

export const helmChartRepoModelProviderForBreadcrumbs = applyCodeRefSymbol(() =>
  import(
    './useHelmChartRepositoriesBreadcrumbs' /* webpackChunkName: "helmcahrt-model-provider-breadcrumbs" */
  ).then((m) => m.getHelmChartRepositoriesModel),
);
