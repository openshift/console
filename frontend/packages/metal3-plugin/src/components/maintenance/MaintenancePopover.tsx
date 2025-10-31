import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import { MaintenanceIcon } from '@patternfly/react-icons/dist/esm/icons/maintenance-icon';
import { PopoverStatus, StatusIconAndText } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getNodeMaintenancePhase } from '../../selectors';
import StartingMaintenancePopoverContent from './StartingMaintenancePopoverContent';
import UnderMaintenancePopoverContent from './UnderMaintenancePopoverContent';

type MaintenancePopoverProps = {
  title: string;
  nodeMaintenance: K8sResourceKind;
  className?: string;
  children?: React.ReactNode;
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
