import type { FC } from 'react';
import { RhUiInProgressIcon, RhUiOffIcon, RhUiRunningIcon } from '@patternfly/react-icons';
import {
  HOST_POWER_STATUS_POWERED_OFF,
  HOST_POWER_STATUS_POWERED_ON,
} from '../../constants/bare-metal-host';

type BareMetalHostPowerStatusIconProps = {
  powerStatus: string;
};

const BareMetalHostPowerStatusIcon: FC<BareMetalHostPowerStatusIconProps> = ({
  powerStatus,
  ...iconProps
}) => {
  if (powerStatus === HOST_POWER_STATUS_POWERED_ON) return <RhUiRunningIcon {...iconProps} />;
  if (powerStatus === HOST_POWER_STATUS_POWERED_OFF) return <RhUiOffIcon {...iconProps} />;
  return <RhUiInProgressIcon {...iconProps} />;
};

export default BareMetalHostPowerStatusIcon;
