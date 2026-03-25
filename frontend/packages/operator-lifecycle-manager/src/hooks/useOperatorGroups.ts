import type { WatchK8sResult } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  useK8sWatchResource,
  getGroupVersionKindForModel,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { OperatorGroupModel } from '../models';
import type { OperatorGroupKind } from '../types';

export const useOperatorGroups = (): WatchK8sResult<OperatorGroupKind[]> =>
  useK8sWatchResource<OperatorGroupKind[]>({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(OperatorGroupModel),
  });
