import type { FeatureFlagHandler } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { useChannelModels, useEventSourceModels } from '../utils/fetch-dynamic-eventsources-utils';

/**
 * Eagerly discovers dynamic Eventing CRD models (event sources and channels)
 * at app root via a console.flag/hookProvider extension gated on the
 * KNATIVE_EVENTING flag, so synchronous cache readers (topology, kebab
 * actions, breadcrumbs) see populated models.
 */
export const useKnativeEventingModelPreloader: FeatureFlagHandler = () => {
  useEventSourceModels();
  useChannelModels();
};
