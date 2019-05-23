import * as React from 'react';
import * as _ from 'lodash-es';

import {
  getName,
  getNamespace,
  getUid,
  // VmStatus,
  // getSimpleVmStatus,
  // VM_SIMPLE_STATUS_ALL,
  // VM_SIMPLE_STATUS_TO_TEXT,
  //  getResource,
  //  DASHES,
} from 'kubevirt-web-ui-components';

import { NamespaceModel } from '@console/internal/models';
import { ListHeader, ColHead, List, ListPage, ResourceRow } from '@console/internal/components/factory';
import { ResourceLink } from '@console/internal/components/utils';
// import { actions } from '../../module/okdk8s';

import {
  VirtualMachineModel,
  // VirtualMachineInstanceModel,
  // VirtualMachineInstanceMigrationModel,
} from '../models';

// import { openCreateVmWizard } from '../modals/create-vm-modal';
// import { menuActions } from './menu-actions';
// import { WithResources } from '../utils/withResources';

const mainRowSize = 'col-lg-4 col-md-4 col-sm-6 col-xs-6';
const otherRowSize = 'col-lg-4 col-md-4 hidden-sm hidden-xs';

const VMHeader = props => <ListHeader>
  <ColHead {...props} className={mainRowSize} sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className={otherRowSize} sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className={mainRowSize} sortField="spec.running">State</ColHead>
</ListHeader>;

const VMRow = ({ obj: vm }) => {
  const name = getName(vm);
  const namespace = getNamespace(vm);
  const uid = getUid(vm);

  /*
  TODO(mlibra) To keep recent PR minimal, relations to other objects will be migrated as a next step.
               Keeping the code here for reference.
  const migrationResources = getResource(VirtualMachineInstanceMigrationModel, {namespace});
  const resourceMap = {
    pods: {
      resource: getResource(PodModel, { namespace }),
    },
    migrations: {
      resource: migrationResources,
    },
  };
  */

  return <ResourceRow obj={vm}>
    <div className={mainRowSize}>
      <ResourceLink kind={VirtualMachineModel.kind} name={name} namespace={namespace} title={uid} />
    </div>
    <div className={otherRowSize}>
      <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
    </div>
    <div className={mainRowSize}>
      {/*
        <WithResources resourceMap={resourceMap} loaderComponent={() => DASHES}>
          <VmStatus vm={vm}/>
        </WithResources>
      */}
    </div>
    <div className="dropdown-kebab-pf">
      {/*
      <ResourceKebab actions={menuActions} kind={VirtualMachineModel.kind} resource={vm} resources={[
        getResource(VirtualMachineInstanceModel, { name, namespace, isList: false }),
        getResource(VirtualMachineInstanceMigrationModel, {namespace}),
        getResource(PodModel, {namespace}),
      ]} />
      */}
    </div>
  </ResourceRow>;
};

const VMList: React.FC = props => <List {...props} Header={VMHeader} Row={VMRow} />;
VMList.displayName = 'VMList';

const filters = undefined;
/* TODO(mlibra): introduce extension point for list.tsx and reenable here then
const filters = [{
  type: 'vm-status',
  selected: VM_SIMPLE_STATUS_ALL,
  reducer: getSimpleVmStatus,
  items: VM_SIMPLE_STATUS_ALL.map(status => ({ id: status, title: VM_SIMPLE_STATUS_TO_TEXT[status] }) ),
}];
*/

const createItems = {
  wizard: 'Create with Wizard',
  yaml: 'Create from YAML',
};

export type VirtualMachinesPageProps = {
  namespace: string;
};

export class VirtualMachinesPage extends React.Component<VirtualMachinesPageProps> {
  createProps = {
    items: createItems,
    createLink: (type) => {
      switch (type) {
        case 'wizard':
          return () => {
            window.console.log('TODO: start wizard'); // TODO(mlibra)
          };
          // return () => openCreateVmWizard(this.props.namespace);
        default:
          return `/k8s/ns/${this.props.namespace || 'default'}/virtualmachines/~new/`; // TODO
      }
    },
  };

  shouldComponentUpdate(nextProps: VirtualMachinesPageProps) {
    return !_.isEqual(nextProps, this.props);
  }

  render() {
    return <ListPage
      {...this.props}
      canCreate={true}
      kind={VirtualMachineModel.kind}
      ListComponent={VMList}
      createProps={this.createProps}
      rowFilters={filters}
    />;
  }
}
