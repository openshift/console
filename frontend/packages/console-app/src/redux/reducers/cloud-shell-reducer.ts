import { CloudShellActions, Actions } from '../actions/cloud-shell-actions';
import { RootState } from '@console/internal/redux';

export const cloudShellReducerName = 'cloudShell';

type State = {
  isExpanded: boolean;
};

const initialState: State = {
  isExpanded: false,
};

export default (state = initialState, action: CloudShellActions) => {
  if (action.type === Actions.ToggleCloudShellExpanded) {
    return {
      isExpanded: !state.isExpanded,
    };
  }

  return state;
};

export const isCloudShellExpanded = (state: RootState): boolean =>
  !!state.plugins?.console?.[cloudShellReducerName]?.isExpanded;
