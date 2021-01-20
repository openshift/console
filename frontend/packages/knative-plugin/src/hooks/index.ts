import { getExecutableCodeRef } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-utils';

export const eventSourceBreadcrumbsProvider = getExecutableCodeRef(() =>
  import(
    './useEventSourceDetailPageBreadCrumbs' /* webpackChunkName: "event-source-breadcrumbs-provider" */
  ).then((m) => m.useEventSourceDetailPageBreadCrumbs),
);

export const eventSourceModelsProviderForBreadCrumbs = getExecutableCodeRef(() =>
  import(
    './useEventSourceDetailPageBreadCrumbs' /* webpackChunkName: "event-source-models-provider-breadcrumbs" */
  ).then((m) => m.getEventSourceModelsForBreadcrumbs),
);
