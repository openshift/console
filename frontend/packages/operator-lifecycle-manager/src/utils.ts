import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { ObjectMetadata } from '@console/internal/module/k8s';
import { INTERNAL_OBJECTS_ANNOTATION } from './const';
import { SubscriptionKind, SubscriptionState } from './types';

export const getInternalObjects = (annotations: ObjectMetadata['annotations']): string[] =>
  parseJSONAnnotation(annotations, INTERNAL_OBJECTS_ANNOTATION) ?? [];

export const upgradeRequiresApproval = (subscription: SubscriptionKind): boolean =>
  subscription?.status?.state === SubscriptionState.SubscriptionStateUpgradePending &&
  (subscription.status?.conditions ?? []).filter(
    ({ status, reason }) => status === 'True' && reason === 'RequiresApproval',
  ).length > 0;
