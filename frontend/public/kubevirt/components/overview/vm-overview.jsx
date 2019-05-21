import React from 'react';
import * as _ from 'lodash-es';
import { getResource } from 'kubevirt-web-ui-components';

import { VirtualMachineModel, PodModel, VirtualMachineInstanceMigrationModel, VirtualMachineInstanceModel } from '../../../models';
import { ResourceOverviewDetails } from '../okdcomponents';

import { menuActions } from '../vm/menu-actions';
import { ConnectedVmDetails } from '../vm';
import { WithResources } from '../utils/withResources';

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

const ConnctedResourceOverviewDetails = ({ item, pods, migrations, vmi }) => {
  const actionArgs = {};
  actionArgs[PodModel.kind] = pods;
  actionArgs[VirtualMachineInstanceMigrationModel.kind] = migrations;
  actionArgs[VirtualMachineInstanceModel.kind] = vmi;

  const menuActions_ = _.map(menuActions, m => (kind, vm) => m(kind, vm, actionArgs));
  return (
    <ResourceOverviewDetails
      item={item}
      kindObj={VirtualMachineModel}
      menuActions={menuActions_}
      tabs={tabs}
    />
  );
};

export const VirtualMachineOverviewPage = ({ item }) => {
  const vm = item.obj;
  const { name, namespace } = vm.metadata;
  const resourceMap = {
    vmi: {
      resource: getResource(VirtualMachineInstanceModel, {name, namespace, isList: false}),
      ignoreErrors: true,
    },
    pods: {
      resource: getResource(PodModel, { namespace }),
    },
    migrations: {
      resource: getResource(VirtualMachineInstanceMigrationModel, {namespace}),
    },
  };

  return (
    <WithResources resourceMap={resourceMap}>
      <ConnctedResourceOverviewDetails
        item={item}
      />
    </WithResources>
  );
};
