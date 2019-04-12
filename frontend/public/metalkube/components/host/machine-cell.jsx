import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from 'patternfly-react';
import {
  canHostAddMachine,
  DASHES,
  getHostMachineName,
} from 'kubevirt-web-ui-components';

import { MachineModel } from '../../models';
import { ResourceLink } from '../utils/okdutils';
import { referenceForModel } from '../../../module/k8s';

const MachineCell = ({ host }) => {
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
  } else if (canHostAddMachine(host)) {
    const ref = referenceForModel(MachineModel);
    const href = `/k8s/ns/${namespace || 'default'}/${ref}/new`;
    return (
      <Link to={href}>
        <span className="co-icon-and-text">
          <Icon
            type="pf"
            name="add-circle-o"
            className="co-icon-and-text__icon"
          />
          Add machine
        </span>
      </Link>
    );
  }
  return DASHES;
};

export default MachineCell;
