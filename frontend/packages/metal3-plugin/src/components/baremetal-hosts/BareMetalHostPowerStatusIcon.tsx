import * as React from 'react';
import { OnRunningIcon, OffIcon, InProgressIcon } from '@patternfly/react-icons';
import { HOST_POWER_STATUS_POWERED_OFF, HOST_POWER_STATUS_POWERED_ON } from '../../constants';

type BareMetalHostPowerStatusIconProps = {
  powerStatus: string;
};

const BareMetalHostPowerStatusIcon: React.FC<BareMetalHostPowerStatusIconProps> = ({
  powerStatus,
  ...iconProps
}) => {
  if (powerStatus === HOST_POWER_STATUS_POWERED_ON) return <OnRunningIcon {...iconProps} />;
  if (powerStatus === HOST_POWER_STATUS_POWERED_OFF) return <OffIcon {...iconProps} />;
  return <InProgressIcon {...iconProps} />;
};

export default BareMetalHostPowerStatusIcon;
