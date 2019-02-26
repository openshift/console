import * as React from 'react';

import { VirtualMachineModel } from '../../../models';
import { NetworkingOverview, ResourceOverviewDetails, OverviewItem } from '../okdcomponents';

import { menuActions } from '../vm/menu-actions';
import { ConnectedVmDetails } from '../vm';

const VirtualMachineOverviewDetails = ({ item }) =>
  <div className="overview__sidebar-pane-body resource-overview__body">
    <ConnectedVmDetails obj={item.obj} overview={true} />
  </div>;

const tabs = [
  {
    name: 'Overview',
    component: VirtualMachineOverviewDetails,
  },
];

export const VirtualMachineOverviewPage = ({ item }) =>
  <ResourceOverviewDetails
    item={item}
    kindObj={VirtualMachineModel}
    menuActions={menuActions}
    tabs={tabs}
  />;
