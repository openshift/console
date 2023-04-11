import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import useCloudShellAvailable from '../../components/cloud-shell/useCloudShellAvailable';
import { FLAG_WEB_TERMINAL } from '../../consts';

export const useWebTerminalProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(FLAG_WEB_TERMINAL, useCloudShellAvailable());
};
