import { useCallback, useMemo } from 'react';
import {
  isPostFormSubmissionAction,
  PostFormSubmissionAction,
  useExtensions,
} from '@console/plugin-sdk';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { useQueryParams } from './useQueryParams';

export const usePostFormSubmitAction = <R = K8sResourceCommon[]>(
  key: string = 'action',
): ((arg: R) => void) => {
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
    (arg: R) => {
      if (filteredExtensions.length > 0) {
        filteredExtensions.forEach(({ properties: { type, callback } }) => {
          if (actionPayload[type]) {
            callback(arg, actionPayload[type]);
          } else {
            callback(arg);
          }
        });
      }
    },
    [filteredExtensions, actionPayload],
  );

  return formCallback;
};
