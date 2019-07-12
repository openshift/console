import * as React from 'react';
import { Link } from 'react-router-dom';
import { AddCircleOIcon } from '@patternfly/react-icons';

import { DASH } from '@console/shared';
import { MachineModel } from '@console/internal/models';
import {
  ResourceLink,
  RequireCreatePermission,
  StatusIconAndText,
} from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';

import { getHostMachineName } from '../selectors';
import { canHostAddMachine } from '../utils/host-status';

interface MachineCellProps {
  host: K8sResourceKind;
}

const MachineCell: React.FC<MachineCellProps> = ({ host }) => {
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
  if (canHostAddMachine(host)) {
    const ns = namespace || 'default';
    const href = `/k8s/ns/${ns}/${referenceForModel(MachineModel)}/~new`;
    return (
      <RequireCreatePermission model={MachineModel} namespace={ns}>
        <Link to={href}>
          <StatusIconAndText status="Add machine" icon={<AddCircleOIcon />} />
        </Link>
      </RequireCreatePermission>
    );
  }
  return <>{DASH}</>;
};

export default MachineCell;
