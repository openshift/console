import * as React from 'react';
import {
  HourglassHalfIcon,
  InProgressIcon,
  OffIcon,
  PausedIcon,
  SyncAltIcon,
  UnknownIcon,
} from '@patternfly/react-icons';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';
import GenericStatus from '@console/shared/src/components/status/GenericStatus';
import { isVM } from '../../selectors/check-type';
import { VMIKind, VMKind } from '../../types';
import { hasPendingChanges } from '../../utils/pending-changes';
import { PendingChangesPopoverContent } from '../vm-status/vm-status';

enum VMStatusSimpleLabel {
  Starting = 'Starting',
  Paused = 'Paused',
  Migrating = 'Migrating',
  Stopping = 'Stopping',
  Running = 'Running',
  Stopped = 'Stopped',
  Deleting = 'Deleting',
}

const vmPhase = (vm: VMKind | VMIKind) =>
  vm.status?.printableStatus || vm.status?.phase || 'Unknown';

const getVMStatusIcon = (
  status: string,
  arePendingChanges: boolean,
): React.ComponentClass | React.FC => {
  let icon: React.ComponentClass | React.FC = UnknownIcon;

  if (status === VMStatusSimpleLabel.Paused) {
    icon = PausedIcon;
  } else if (status === VMStatusSimpleLabel.Running) {
    icon = SyncAltIcon;
  } else if (status === VMStatusSimpleLabel.Stopped) {
    icon = OffIcon;
  } else if (status.toLowerCase().includes('error')) {
    icon = RedExclamationCircleIcon;
  } else if (
    status.toLowerCase().includes('pending') ||
    status.toLowerCase().includes('provisioning')
  ) {
    // should be called before inProgress
    icon = HourglassHalfIcon;
  } else if (status.toLowerCase().includes('starting')) {
    icon = InProgressIcon;
  }

  if (arePendingChanges) {
    icon = YellowExclamationTriangleIcon;
  }

  return icon;
};

const VirtualMachinesPageStatus: React.FC<VirtualMachinesPageStatusProps> = ({
  vm,
  vmi,
  vmiLoaded,
  vmiLoadError,
}) => {
  const phase = vmPhase(vm);
  const arePendingChanges =
    isVM(vm) && vmiLoaded && !vmiLoadError && hasPendingChanges(vm as VMKind, vmi);

  return (
    <GenericStatus title={phase} Icon={getVMStatusIcon(phase, arePendingChanges)}>
      {arePendingChanges && (
        <PendingChangesPopoverContent key="pcPopoverContent" vm={vm as VMKind} vmi={vmi} />
      )}
    </GenericStatus>
  );
};

type VirtualMachinesPageStatusProps = {
  vm: VMKind | VMIKind;
  vmi: VMIKind;
  vmiLoaded: boolean;
  vmiLoadError: boolean;
};

export { VirtualMachinesPageStatus };
