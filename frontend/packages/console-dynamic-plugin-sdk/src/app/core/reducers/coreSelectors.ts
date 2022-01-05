import { ImpersonateKind, SDKStoreState, UserKind } from '../../redux-types';

type GetImpersonate = (state: SDKStoreState) => ImpersonateKind;
type GetUser = (state: SDKStoreState) => UserKind;

/**
 * It provides impersonation details from the redux store.
 * @param state the root state
 * @return The the impersonate state.
 * * */
export const getImpersonate: GetImpersonate = (state) => state.sdkCore.impersonate;

/**
 * It provides user details from the redux store.
 * @param state the root state
 * @return The the user state.
 * * */
export const getUser: GetUser = (state) => state.sdkCore.user;
