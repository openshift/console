import { useCallback, useMemo } from 'react';
import { INCONTEXT_ACTIONS_CONNECTS_TO } from '@console/dev-console/src/const';
import type { K8sResourceCommon } from '@console/internal/module/k8s';
import { doConnectsToBinding } from '@console/topology/src/utils/connector-utils';
import { useQueryParams } from './useQueryParams';

/**
 * Reads an action from the current query params and return a callback to
 * connect a newly created resource to an existing one in the topology view
 */
export const useResourceConnectionHandler = <
  R extends K8sResourceCommon[] | K8sResourceCommon = K8sResourceCommon[]
>(
  key: string = 'action',
): ((arg: R) => Promise<R>) => {
  const params = useQueryParams();
  const actionParams = params.get(key);

  const [actionTypes] = useMemo(() => {
    let parsedAction;
    try {
      parsedAction = JSON.parse(actionParams);
    } catch {
      return [[]];
    }
    if (!parsedAction) return [[]];
    if (Array.isArray(parsedAction)) {
      return parsedAction.reduce(
        ([types, payload], a) => {
          types.push(a.type);
          payload[a.type] = a.payload;
          return [types, payload];
        },
        [[]],
      );
    }
    return [[parsedAction.type], { [parsedAction.type]: parsedAction.payload }];
  }, [actionParams]);

  return useCallback(
    async (arg: R) => {
      if (actionTypes.includes(INCONTEXT_ACTIONS_CONNECTS_TO)) {
        await doConnectsToBinding<R>(arg, INCONTEXT_ACTIONS_CONNECTS_TO);
      }
      return arg;
    },
    [actionTypes],
  );
};
