import * as React from 'react';
// import { Link } from 'react-router-dom';
// import { Icon } from 'patternfly-react';

import { DASH } from '@console/shared';
import { MachineModel } from '@console/internal/models';
import { ResourceLink /* , RequireCreatePermission */ } from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';

import { getHostMachineName } from '../selectors';

interface MachineCellProps {
  host: K8sResourceKind;
}

const MachineCell = ({ host }: MachineCellProps) => {
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
  // TODO(jtomasek): Re-enable this once host status is added
  // if (canHostAddMachine(host)) {
  //   const ns = namespace || 'default';
  //   const href = `/k8s/ns/${ns}/${referenceForModel(MachineModel)}/~new`;
  //   return (
  //     <RequireCreatePermission model={MachineModel} namespace={ns}>
  //       <Link to={href}>
  //         <span className="co-icon-and-text">
  //           <Icon type="pf" name="add-circle-o" className="co-icon-and-text__icon" />
  //           Add machine
  //         </span>
  //       </Link>
  //     </RequireCreatePermission>
  //   );
  // }
  return <>{DASH}</>;
};

export default MachineCell;
