import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';

export const eventSourceBreadcrumbsProvider = applyCodeRefSymbol(() =>
  import(
    './useEventSourceDetailPageBreadcrumbs' /* webpackChunkName: "event-source-breadcrumbs-provider" */
  ).then((m) => m.useEventSourceDetailPageBreadcrumbs),
);

export const eventSourceModelsProviderForBreadcrumbs = applyCodeRefSymbol(() =>
  import(
    './useEventSourceDetailPageBreadcrumbs' /* webpackChunkName: "event-source-models-provider-breadcrumbs" */
  ).then((m) => m.getEventSourceModelsForBreadcrumbs),
);

export const channelBreadcrumbsProvider = applyCodeRefSymbol(() =>
  import(
    './useChannelDetailPageBreadcrumbs' /* webpackChunkName: "channel-breadcrumbs-provider" */
  ).then((m) => m.useChannelDetailPageBreadcrumbs),
);

export const channelModelsProviderForBreadcrumbs = applyCodeRefSymbol(() =>
  import(
    '../utils/fetch-dynamic-eventsources-utils' /* webpackChunkName: "channel-models-provider-breadcrumbs" */
  ).then((m) => m.getChannelModels),
);

export const brokerBreadcrumbsProvider = applyCodeRefSymbol(() =>
  import(
    './useBrokerDetailPageBreadcrumbs' /* webpackChunkName: "broker-breadcrumbs-provider" */
  ).then((m) => m.useBrokerDetailPageBreadcrumbs),
);

export const brokerModelProviderForBreadcrumbs = applyCodeRefSymbol(() =>
  import(
    './useBrokerDetailPageBreadcrumbs' /* webpackChunkName: "broker-model-provider-breadcrumbs" */
  ).then((m) => m.getBrokerModel),
);
