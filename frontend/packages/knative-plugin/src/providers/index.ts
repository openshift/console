import { getExecutableCodeRef } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-utils';

export const eventSourceBreadcrumbsProvider = getExecutableCodeRef(() =>
  import(
    './useEventSourceDetailPageBreadcrumbs' /* webpackChunkName: "event-source-breadcrumbs-provider" */
  ).then((m) => m.useEventSourceDetailPageBreadcrumbs),
);

export const eventSourceModelsProviderForBreadcrumbs = getExecutableCodeRef(() =>
  import(
    './useEventSourceDetailPageBreadcrumbs' /* webpackChunkName: "event-source-models-provider-breadcrumbs" */
  ).then((m) => m.getEventSourceModelsForBreadcrumbs),
);

export const channelBreadcrumbsProvider = getExecutableCodeRef(() =>
  import(
    './useChannelDetailPageBreadcrumbs' /* webpackChunkName: "channel-breadcrumbs-provider" */
  ).then((m) => m.useChannelDetailPageBreadcrumbs),
);

export const channelModelsProviderForBreadcrumbs = getExecutableCodeRef(() =>
  import(
    '../utils/fetch-dynamic-eventsources-utils' /* webpackChunkName: "channel-models-provider-breadcrumbs" */
  ).then((m) => m.getChannelModels),
);

export const brokerBreadcrumbsProvider = getExecutableCodeRef(() =>
  import(
    './useBrokerDetailPageBreadcrumbs' /* webpackChunkName: "broker-breadcrumbs-provider" */
  ).then((m) => m.useBrokerDetailPageBreadcrumbs),
);

export const brokerModelProviderForBreadcrumbs = getExecutableCodeRef(() =>
  import(
    './useBrokerDetailPageBreadcrumbs' /* webpackChunkName: "broker-model-provider-breadcrumbs" */
  ).then((m) => m.getBrokerModel),
);
