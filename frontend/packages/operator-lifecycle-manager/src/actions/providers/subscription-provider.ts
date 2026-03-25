import type { SubscriptionKind } from 'packages/operator-lifecycle-manager/src/types';
import { useSubscriptionActions } from '../hooks/useSubscriptionActions';

export const useSubscriptionActionsProvider = (resource: SubscriptionKind) => {
  const subscriptionActions = useSubscriptionActions(resource);

  return [subscriptionActions, true];
};
