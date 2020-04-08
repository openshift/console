import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PopoverStatus } from '@console/shared';
import { InProgressIcon, MaintenanceIcon } from '@patternfly/react-icons';
import { getNodeMaintenancePhase } from '../../selectors';
import UnderMaintenancePopoverContent from './UnderMaintenancePopoverContent';
import StartingMaintenancePopoverContent from './StartingMaintenancePopoverContent';

type MaintenancePopoverProps = {
  title: string;
  nodeMaintenance: K8sResourceKind;
  className?: string;
};

const MaintenancePopover: React.FC<MaintenancePopoverProps> = ({
  title,
  nodeMaintenance,
  className,
}) => {
  const phase = getNodeMaintenancePhase(nodeMaintenance);

  return (
    <PopoverStatus
      icon={phase === 'Succeeded' ? <MaintenanceIcon /> : <InProgressIcon />}
      title={title}
      className={className}
    >
      {phase === 'Succeeded' ? (
        <UnderMaintenancePopoverContent nodeMaintenance={nodeMaintenance} />
      ) : (
        <StartingMaintenancePopoverContent nodeMaintenance={nodeMaintenance} />
      )}
    </PopoverStatus>
  );
};

export default MaintenancePopover;
