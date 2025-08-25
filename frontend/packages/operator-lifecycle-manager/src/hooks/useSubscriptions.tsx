import {
  useK8sWatchResource,
  getGroupVersionKindForModel,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { WatchK8sResult } from '@console/internal/module/k8s';
import { SubscriptionModel } from '../models';
import { SubscriptionKind } from '../types';

export const useSubscriptions = (): WatchK8sResult<SubscriptionKind[]> =>
  useK8sWatchResource<SubscriptionKind[]>({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(SubscriptionModel),
  });
