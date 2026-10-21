import type { SubscriptionKind } from './types';
import { SubscriptionState } from './types';

export const isCatalogSourceTrusted = (catalogSource: string): boolean =>
  catalogSource === 'redhat-operators';

export const upgradeRequiresApproval = (subscription: SubscriptionKind): boolean =>
  subscription?.status?.state === SubscriptionState.SubscriptionStateUpgradePending &&
  (subscription.status?.conditions ?? []).filter(
    ({ status, reason }) => status === 'True' && reason === 'RequiresApproval',
  ).length > 0;
