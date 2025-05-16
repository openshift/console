import { Action } from '@console/dynamic-plugin-sdk';
import { K8sModel, K8sResourceKind } from '@console/internal/module/k8s';
import { CommonActionCreator } from './types';
import { useCommonActions } from './useCommonActions';

/**
 * A React hook for retrieving a single common action related to Kubernetes resources.
 * This is a convenience wrapper around useCommonActions for when you only need one action.
 *
 * @param {K8sModel} kind - The K8s model for the resource.
 * @param {K8sResourceKind} obj - The specific resource instance for which to generate the action.
 * @param {CommonActionCreator} actionCreator - The single action creator to use.
 * @param {JSX.Element} [message] - Optional message to display in the delete modal.
 *
 * This hook is robust to inline arguments, thanks to internal deep compare memoization.
 *
 * @returns {Action} The generated action.
 *
 * @example
 * // Getting a ModifyCount action
 * const MyResourceComponent = ({ kind, obj }) => {
 *   const modifyCountAction = useCommonAction(kind, obj, CommonActionCreator.ModifyCount);
 *   return <ActionButton action={modifyCountAction} />;
 * };
 */
export const useCommonAction = (
  kind: K8sModel,
  obj: K8sResourceKind,
  actionCreator: CommonActionCreator,
  message?: JSX.Element,
): Action => {
  const actions = useCommonActions(kind, obj, [actionCreator] as const, message);
  return actions[actionCreator];
};
