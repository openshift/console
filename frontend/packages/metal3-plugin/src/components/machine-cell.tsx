import * as React from 'react';
import { DASH, getNamespace } from '@console/shared';
import { MachineModel } from '@console/internal/models';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { getHostMachineName } from '../selectors';

interface MachineCellProps {
  host: K8sResourceKind;
}

const MachineCell: React.FC<MachineCellProps> = ({ host }) => {
  const machineName = getHostMachineName(host);

  const namespace = getNamespace(host);

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
  return <>{DASH}</>;
};

export default MachineCell;
