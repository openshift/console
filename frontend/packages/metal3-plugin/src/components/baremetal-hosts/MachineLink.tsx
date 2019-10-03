import * as React from 'react';
import { Link } from 'react-router-dom';
import { AddCircleOIcon } from '@patternfly/react-icons';
import { DASH, StatusIconAndText } from '@console/shared';
import { MachineModel } from '@console/internal/models';
import { ResourceLink, RequireCreatePermission } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { getHostMachineName } from '../../selectors';
import { canHostAddMachine } from '../../utils/host-status';
import { HostMultiStatus } from '../types';
import { BareMetalHostKind } from '../../types';

interface MachineCellProps {
  host: BareMetalHostKind;
  status: HostMultiStatus;
}

const MachineCell: React.FC<MachineCellProps> = ({ host, status }) => {
  const machineName = getHostMachineName(host);

  const {
    metadata: { namespace },
  } = host;

  if (machineName) {
    return (
      <ResourceLink
        kind={referenceForModel(MachineModel)}
        name={machineName}
        namespace={namespace}
        title={machineName}
      />
    );
  }
  if (canHostAddMachine(status.status)) {
    const ns = namespace || 'default';
    const href = `/k8s/ns/${ns}/${referenceForModel(MachineModel)}/~new`;
    return (
      <RequireCreatePermission model={MachineModel} namespace={ns}>
        <Link to={href}>
          <StatusIconAndText icon={<AddCircleOIcon />} title="Add machine" />
        </Link>
      </RequireCreatePermission>
    );
  }
  return <>{DASH}</>;
};

export default MachineCell;
