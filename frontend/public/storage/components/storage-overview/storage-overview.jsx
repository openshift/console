import React from 'react';

import * as dashboardMockup from '../../../imgs/storage-dashboard.jpg';

export class StorageOverview extends React.Component {
  constructor(props){
    super(props);

  }

  render() {
    return (
      <img src={dashboardMockup} />
    );
  }
}
