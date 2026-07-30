import type { FC } from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { MachineModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { DASH } from '@console/shared/src/constants/ui';
import { getNamespace } from '@console/shared/src/selectors/common';
import { getHostMachineName } from '../../selectors/baremetal-hosts';
import type { BareMetalHostKind } from '../../types/host';

interface MachineLinkProps {
  host: BareMetalHostKind;
}

const MachineLink: FC<MachineLinkProps> = ({ host }) => {
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

export default MachineLink;
