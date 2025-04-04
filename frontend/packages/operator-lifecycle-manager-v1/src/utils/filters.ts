import {
  capabilityLevelSort,
  infraFeaturesSort,
  providerSort,
  sourceSort,
  validSubscriptionSort,
} from '@console/operator-lifecycle-manager/src/components/operator-hub/operator-hub-utils';
import { alphanumericCompare } from '@console/shared/src/utils/utils';

export const providerComparator = (a: string, b: string): number =>
  alphanumericCompare(providerSort(a), providerSort(b));

export const sourceComparator = (a: string, b: string): number => sourceSort(a) - sourceSort(b);

export const capabilityLevelComparator = (a: string, b: string): number =>
  capabilityLevelSort(a) - capabilityLevelSort(b);

export const infraFeatureComparator = (a: string, b: string): number =>
  infraFeaturesSort(a) - infraFeaturesSort(b);

export const validSubscriptionComparator = (a: string, b: string): number =>
  validSubscriptionSort(a) - validSubscriptionSort(b);
