import * as React from 'react';
import { InProgressIcon, MaintenanceIcon } from '@patternfly/react-icons';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PopoverStatus, StatusIconAndText } from '@console/shared';
import { getNodeMaintenancePhase } from '../../selectors';
import StartingMaintenancePopoverContent from './StartingMaintenancePopoverContent';
import UnderMaintenancePopoverContent from './UnderMaintenancePopoverContent';

type MaintenancePopoverProps = {
  title: string;
  nodeMaintenance: K8sResourceKind;
  className?: string;
};

const MaintenancePopover: React.FC<MaintenancePopoverProps> = ({
  title,
  nodeMaintenance,
  className,
  children,
}) => {
  const phase = getNodeMaintenancePhase(nodeMaintenance);

  return (
    <PopoverStatus
      title={title}
      statusBody={
        <StatusIconAndText
          title={title}
          icon={phase === 'Succeeded' ? <MaintenanceIcon /> : <InProgressIcon />}
          className={className}
        />
      }
    >
      {phase === 'Succeeded' ? (
        <UnderMaintenancePopoverContent nodeMaintenance={nodeMaintenance} />
      ) : (
        <StartingMaintenancePopoverContent nodeMaintenance={nodeMaintenance} />
      )}
      {children}
    </PopoverStatus>
  );
};

export default MaintenancePopover;
