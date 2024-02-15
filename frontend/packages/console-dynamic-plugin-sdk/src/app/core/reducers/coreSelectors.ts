import { UserInfo } from '../../../extensions';
import { ImpersonateKind, SDKStoreState } from '../../redux-types';

type GetImpersonate = (state: SDKStoreState) => ImpersonateKind;
type GetUser = (state: SDKStoreState) => UserInfo;

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
export const getUser: GetUser = (state) => {
  return state.sdkCore.user;
};
