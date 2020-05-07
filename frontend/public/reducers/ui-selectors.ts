import { RootState } from '../redux-types';

export const createProjectMessageStateToProps = ({ UI }: RootState) => {
  return { createProjectMessage: UI.get('createProjectMessage') as string };
};

export const userStateToProps = ({ UI }: RootState) => {
  return { user: UI.get('user') };
};

export const impersonateStateToProps = ({ UI }: RootState) => {
  return { impersonate: UI.get('impersonate') };
};

export const getActiveNamespace = ({ UI }: RootState): string => UI.get('activeNamespace');

export const getActivePerspective = ({ UI }: RootState): string => UI.get('activePerspective');

export const getActiveApplication = ({ UI }: RootState): string => UI.get('activeApplication');

export const getPinnedResources = (rootState: RootState): string[] =>
  rootState.UI.get('pinnedResources')[getActivePerspective(rootState)];
