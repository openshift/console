import React from 'react';

import { ResourceLink } from '../utils/okdutils';

const MachineLink = ({ name }) => {
  if (!name) {
    // TODO(jtomasek): display machine creation link, machine status etc.
    // based on host status
    return <React.Fragment>-</React.Fragment>;
  }
  <ResourceLink kind="Machine" name={name} title={name} />;
};

export default MachineLink;
