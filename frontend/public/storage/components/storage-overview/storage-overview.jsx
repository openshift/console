import React from 'react';

import * as dashboardMockup from '../../../imgs/ocs-dashboard.png';

export class StorageOverview extends React.Component {
  constructor(props){
    super(props);

  }

  render() {
    return (
      <img className="storage-dashboard-mockup" src={dashboardMockup} />
    );
  }
}
