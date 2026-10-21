import { useMemo } from 'react';
import type { Action } from '@console/dynamic-plugin-sdk';
import type { K8sModel, K8sResourceKind } from '@console/internal/module/k8s';
import { CommonActionCreator } from './types';
import { useCommonActions } from './useCommonActions';

/**
 * A React hook for retrieving common resource actions.
 * This is a convenience wrapper around useCommonActions for when you only need standard Edit, Delete, Modify Labels and Annotations actions.
 *
 * @param kind - The K8s model for the resource.
 * @param resource - The specific resource instance for which to generate the action.
 * @param actionCreator - The single action creator to use.
 * @param [message] - Optional message to display in the delete modal.
 * @param editPath - Optional URL path used for editing the resource.
 *
 * This hook is robust to inline arguments, thanks to internal deep compare memoization.
 *
 * @returns The generated actions when ready, empty array when not ready.
 *
 * @example
 * // Getting common resource actions
 * const MyResourceComponent = ({ kind, resource }) => {
 *   const modifyCountAction = useCommonResourceActions(kind, resource);
 *   return <Kebab actions={ actions } />;
 * };
 */
export const useCommonResourceActions = (
  kind: K8sModel | undefined,
  resource: K8sResourceKind | undefined,
  message?: JSX.Element,
  editPath?: string,
): Action[] => {
  const [actions, isReady] = useCommonActions(
    kind,
    resource,
    [
      CommonActionCreator.ModifyLabels,
      CommonActionCreator.ModifyAnnotations,
      CommonActionCreator.Edit,
      CommonActionCreator.Delete,
    ] as const,
    message,
    editPath,
  );
  return useMemo(() => (isReady ? Object.values(actions) : []), [actions, isReady]);
};
