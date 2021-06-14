import { useCallback, useMemo } from 'react';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import {
  isPostFormSubmissionAction,
  PostFormSubmissionAction,
  useExtensions,
} from '@console/plugin-sdk';
import { useQueryParams } from './useQueryParams';

export const usePostFormSubmitAction = <R = K8sResourceCommon[]>(
  key: string = 'action',
): ((arg: R) => Promise<R>) => {
  const params = useQueryParams();
  const actionParams = params.get(key);

  const [actionTypes, actionPayload] = useMemo(() => {
    let parsedAction;
    try {
      parsedAction = JSON.parse(actionParams);
    } catch {
      return [[], {}];
    }
    if (!parsedAction) return [[], {}];
    if (Array.isArray(parsedAction)) {
      return parsedAction.reduce(
        ([types, payload], a) => {
          types.push(a.type);
          payload[a.type] = a.payload;
          return [types, payload];
        },
        [[], {}],
      );
    }
    return [[parsedAction.type], { [parsedAction.type]: parsedAction.payload }];
  }, [actionParams]);

  const extensions = useExtensions<PostFormSubmissionAction<R>>(isPostFormSubmissionAction);
  const filteredExtensions = extensions.filter(({ properties: { type } }) =>
    actionTypes.includes(type),
  );

  const formCallback = useCallback(
    async (arg: R) => {
      if (filteredExtensions.length > 0) {
        await Promise.all(
          filteredExtensions.map(async ({ properties: { type, callback } }) => {
            if (actionPayload[type]) {
              await callback(arg, actionPayload[type]);
            } else {
              await callback(arg);
            }
          }),
        );
      }
      return arg;
    },
    [filteredExtensions, actionPayload],
  );

  return formCallback;
};
