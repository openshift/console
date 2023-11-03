import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import { OffIcon } from '@patternfly/react-icons/dist/esm/icons/off-icon';
import { OnRunningIcon } from '@patternfly/react-icons/dist/esm/icons/on-running-icon';
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
