import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PopoverStatus, getName } from '@console/shared';
import { InProgressIcon, MaintenanceIcon } from '@patternfly/react-icons';
import { getNodeMaintenancePhase } from '../../selectors';
import { BareMetalHostKind } from '../../types';
import UnderMaintenancePopoverContent from './UnderMaintenancePopoverContent';
import StartingMaintenancePopoverContent from './StartingMaintenancePopoverContent';

type MaintenancePopoverProps = {
  title: string;
  maintenance: K8sResourceKind;
  host: BareMetalHostKind;
};

const MaintenancePopover: React.FC<MaintenancePopoverProps> = ({ title, maintenance, host }) => {
  const phase = getNodeMaintenancePhase(maintenance);
  const hostName = getName(host);

  return (
    <PopoverStatus
      icon={phase === 'Succeeded' ? <MaintenanceIcon /> : <InProgressIcon />}
      title={title}
    >
      {phase === 'Succeeded' ? (
        <UnderMaintenancePopoverContent maintenance={maintenance} hostName={hostName} />
      ) : (
        <StartingMaintenancePopoverContent maintenance={maintenance} hostName={hostName} />
      )}
    </PopoverStatus>
  );
};

export default MaintenancePopover;
