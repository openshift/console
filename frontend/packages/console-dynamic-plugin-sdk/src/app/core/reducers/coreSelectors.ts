import { ImpersonateKind, SDKStoreState, UserKind } from '../../redux-types';

type GetImpersonate = (state: SDKStoreState) => ImpersonateKind;
type GetUser = (state: SDKStoreState) => UserKind;
type GetCluster = (state: SDKStoreState) => string;

/**
 * It provides impersonation details from the redux store.
 * @param state the root state
 * @return The the impersonate state.
 * * */
export const getImpersonate: GetImpersonate = (state) => state.sdkCore.impersonate;

/**
 * It provides impersonation details from the redux store as a props object.
 * @param state the root state
 * @return The the impersonation details props object.
 * * */
export const impersonateStateToProps = (state: SDKStoreState) => {
  return { impersonate: getImpersonate(state) };
};

/**
 * It provides user details from the redux store.
 * @param state the root state
 * @return The the user state.
 * * */
export const getUser: GetUser = (state) => state.sdkCore.user;

/**
 * It provides current active cluster.
 * @param state the root state
 * @return The the current active cluster.
 * * */
export const getActiveCluster: GetCluster = (state) =>
  state?.sdkCore?.activeCluster || 'local-cluster';
