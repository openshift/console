import * as React from 'react';
import { HourglassHalfIcon } from '@patternfly/react-icons/dist/esm/icons/hourglass-half-icon';
import { InProgressIcon } from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import { OffIcon } from '@patternfly/react-icons/dist/esm/icons/off-icon';
import { PausedIcon } from '@patternfly/react-icons/dist/esm/icons/paused-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { UnknownIcon } from '@patternfly/react-icons/dist/esm/icons/unknown-icon';
import {
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/dynamic-plugin-sdk';
import { VMStatus as VMStatusEnum } from '../../constants/vm-status';

export const getVMStatusIcon = (
  status: VMStatusEnum,
  arePendingChanges: boolean,
): React.ComponentClass | React.FC => {
  let icon: React.ComponentClass | React.FC = UnknownIcon;

  if (status === VMStatusEnum.PAUSED) {
    icon = PausedIcon;
  } else if (status === VMStatusEnum.RUNNING) {
    icon = SyncAltIcon;
  } else if (status === VMStatusEnum.STOPPED) {
    icon = OffIcon;
  } else if (status.isError()) {
    icon = RedExclamationCircleIcon;
  } else if (status.isPending()) {
    // should be called before inProgress
    icon = HourglassHalfIcon;
  } else if (status.isInProgress()) {
    icon = InProgressIcon;
  }

  if (arePendingChanges) {
    icon = YellowExclamationTriangleIcon;
  }

  return icon;
};
