import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PopoverStatus } from '@console/shared';
import { InProgressIcon, MaintenanceIcon } from '@patternfly/react-icons';
import { getNodeMaintenancePhase } from '../../selectors';
import UnderMaintenancePopoverContent from './UnderMaintenancePopoverContent';
import StartingMaintenancePopoverContent from './StartingMaintenancePopoverContent';

type MaintenancePopoverProps = {
  title: string;
  maintenance: K8sResourceKind;
};

const MaintenancePopover: React.FC<MaintenancePopoverProps> = ({ title, maintenance }) => {
  const phase = getNodeMaintenancePhase(maintenance);

  return (
    <PopoverStatus
      icon={phase === 'Succeeded' ? <MaintenanceIcon /> : <InProgressIcon />}
      title={title}
    >
      {phase === 'Succeeded' ? (
        <UnderMaintenancePopoverContent maintenance={maintenance} />
      ) : (
        <StartingMaintenancePopoverContent maintenance={maintenance} />
      )}
    </PopoverStatus>
  );
};

export default MaintenancePopover;
