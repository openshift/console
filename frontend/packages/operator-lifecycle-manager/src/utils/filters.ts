import type { CatalogItemAttribute } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import type { ResolvedCodeRefProperties } from '@console/dynamic-plugin-sdk/src/types';
import { alphanumericCompare } from '@console/shared/src/utils/utils';
import {
  capabilityLevelSort,
  providerSort,
  sourceSort,
  validSubscriptionSort,
} from '../components/operator-hub/operator-hub-utils';
import { OLMCatalogVersion } from '../const';

export const providerComparator = (a: string, b: string): number =>
  alphanumericCompare(providerSort(a), providerSort(b));

export const sourceComparator = (a: string, b: string): number => sourceSort(a) - sourceSort(b);

export const capabilityLevelComparator = (a: string, b: string): number =>
  capabilityLevelSort(a) - capabilityLevelSort(b);

export const validSubscriptionComparator = (a: string, b: string): number =>
  validSubscriptionSort(a) - validSubscriptionSort(b);

export const operatorCatalogComparator: ResolvedCodeRefProperties<CatalogItemAttribute>['comparator'] =
  (a, b) => {
    if (a === b) return 0;
    if (a === OLMCatalogVersion.OLMv1) return -1;
    if (b === OLMCatalogVersion.OLMv1) return 1;
    return alphanumericCompare(a, b);
  };
