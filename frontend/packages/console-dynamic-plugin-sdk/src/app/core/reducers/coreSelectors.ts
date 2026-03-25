import type { Map as ImmutableMap } from 'immutable';
import type { UserKind } from '@console/internal/module/k8s/types';
import type { UserInfo } from '../../../extensions';
import type { ImpersonateKind, SDKStoreState, AdmissionWebhookWarning } from '../../redux-types';

type GetImpersonate = (state: SDKStoreState) => ImpersonateKind;
type GetUser = (state: SDKStoreState) => UserInfo;
type GetUserResource = (state: SDKStoreState) => UserKind;
type GetAdmissionWebhookWarnings = (
  state: SDKStoreState,
) => ImmutableMap<string, AdmissionWebhookWarning>;

/**
 * It provides impersonation details from the redux store.
 * @param state the root state
 * @returns The the impersonate state.
 */
export const getImpersonate: GetImpersonate = (state) => state.sdkCore.impersonate;

/**
 * It provides impersonation details from the redux store as a props object.
 * @param state the root state
 * @returns The the impersonation details props object.
 */
export const impersonateStateToProps = (state: SDKStoreState) => {
  return { impersonate: getImpersonate(state) };
};

/**
 * It provides user details from the redux store.
 * @param state the root state
 * @returns The the user state.
 */
export const getUser: GetUser = (state) => state.sdkCore.user;

/**
 * It provides user resource details from the redux store.
 * @param state the root state
 * @returns The user resource state.
 */
export const getUserResource: GetUserResource = (state) => state.sdkCore.userResource;

/**
 * It provides admission webhook warning data from the redux store.
 * @param state the root state
 * @returns The the admissionWebhookWarning state.
 */
export const getAdmissionWebhookWarnings: GetAdmissionWebhookWarnings = (state) =>
  state.sdkCore.admissionWebhookWarnings;
