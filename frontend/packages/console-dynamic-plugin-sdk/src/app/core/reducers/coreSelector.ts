import { ImpersonateKind, RootState, UserKind } from '../../redux-types';

type GetImpersonate = (state: RootState) => { impersonate: ImpersonateKind };
type GetUser = (state: RootState) => { user: UserKind };

/**
 * It provides impersonation details from the redux store.
 * @param state the root state
 * @return The the impersonate state.
 * * */
export const getImpersonate: GetImpersonate = (state) => {
  return { impersonate: state.core.impersonate };
};

/**
 * It provides user details from the redux store.
 * @param state the root state
 * @return The the user state.
 * * */
export const getUser: GetUser = (state) => {
  return { user: state.core.user };
};
