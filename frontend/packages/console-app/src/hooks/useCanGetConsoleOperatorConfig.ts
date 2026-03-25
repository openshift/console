import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { useAccessReview } from '@console/dynamic-plugin-sdk';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src';
import { FLAG_CAN_GET_CONSOLE_OPERATOR_CONFIG } from '../consts';

const useCanGetConsoleOperatorConfig = (setFeatureFlag: SetFeatureFlag) => {
  const canGetConsoleOperatorConfig = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'get',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });

  setFeatureFlag(FLAG_CAN_GET_CONSOLE_OPERATOR_CONFIG, canGetConsoleOperatorConfig[0]);
};

export default useCanGetConsoleOperatorConfig;
