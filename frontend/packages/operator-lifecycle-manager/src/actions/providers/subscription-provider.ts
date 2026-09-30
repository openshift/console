import type { SubscriptionKind } from '@console/operator-lifecycle-manager/src/types';
import { useSubscriptionActions } from '../hooks/useSubscriptionActions';

export const useSubscriptionActionsProvider = (resource: SubscriptionKind) => {
  const subscriptionActions = useSubscriptionActions(resource);

  return [subscriptionActions, true];
};
