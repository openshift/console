import { useMemo } from 'react';
import { Action } from '@console/dynamic-plugin-sdk';
import { K8sModel, K8sResourceKind } from '@console/internal/module/k8s';
import { CommonActionCreator } from './types';
import { useCommonActions } from './useCommonActions';

/**
 * A React hook for retrieving common resource actions.
 * This is a convenience wrapper around useCommonActions for when you only need standard Edit, Delete, Modify Labels and Annotations actions.
 *
 * @param {K8sModel | undefined } kind - The K8s model for the resource.
 * @param {K8sResourceKind | undefined} resource - The specific resource instance for which to generate the action.
 * @param {CommonActionCreator} actionCreator - The single action creator to use.
 * @param {JSX.Element} [message] - Optional message to display in the delete modal.
 *
 * This hook is robust to inline arguments, thanks to internal deep compare memoization.
 *
 * @returns {Action[] | []} The generated actions when ready, empty array when not ready.
 *
 * @example
 * // Getting common resource actions
 * const MyResourceComponent = ({ kind, resource }) => {
 *   const modifyCountAction = useCommonResourceActions(kind, resource);
 *   return <Kebab actions={ actions } />;
 * };
 */
export const useCommonResourceActions = (
  kind: K8sModel,
  resource: K8sResourceKind,
  message?: JSX.Element,
): Action[] => {
  const actions = useCommonActions(
    kind,
    resource,
    [
      CommonActionCreator.ModifyLabels,
      CommonActionCreator.ModifyAnnotations,
      CommonActionCreator.Edit,
      CommonActionCreator.Delete,
    ] as const,
    message,
  );
  return useMemo(() => Object.values(actions), [actions]);
};
