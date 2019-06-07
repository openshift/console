import * as React from 'react';

import {
  getName,
  getNamespace,
  // VmStatus,
  // getSimpleVmStatus,
  // VM_SIMPLE_STATUS_ALL,
  // VM_SIMPLE_STATUS_TO_TEXT,
  //  getResource,
  //  DASHES,
} from 'kubevirt-web-ui-components';

import { NamespaceModel } from '@console/internal/models';
import {
  ListHeader,
  ColHead,
  List,
  ListPage,
  ResourceRow,
} from '@console/internal/components/factory';
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

const VMHeader: React.FC = (props) => (
  <ListHeader>
    <ColHead {...props} className={mainRowSize} sortField="metadata.name">
      Name
    </ColHead>
    <ColHead {...props} className={otherRowSize} sortField="metadata.namespace">
      Namespace
    </ColHead>
    {/* TODO(mlibra): migrate VM status in a follow-up
  <ColHead {...props} className={mainRowSize} sortField="spec.running">State</ColHead>
  */}
  </ListHeader>
);

const VMRow = ({ obj: vm }: React.ComponentProps<typeof ResourceRow>) => {
  const name = getName(vm);
  const namespace = getNamespace(vm);

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

  return (
    <ResourceRow obj={vm}>
      <div className={mainRowSize}>
        <ResourceLink kind={VirtualMachineModel.kind} name={name} namespace={namespace} />
      </div>
      <div className={otherRowSize}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </div>
      {/* TODO(mlibra): migrate VM status in a follow-up
    <div className={mainRowSize}>
        <WithResources resourceMap={resourceMap} loaderComponent={() => DASHES}>
          <VmStatus vm={vm}/>
        </WithResources>
    </div>
    */}
      {/* TODO(mlibra): migrate actions in a follow-up
      <div className="dropdown-kebab-pf">
      <ResourceKebab actions={menuActions} kind={VirtualMachineModel.kind} resource={vm} resources={[
        getResource(VirtualMachineInstanceModel, { name, namespace, isList: false }),
        getResource(VirtualMachineInstanceMigrationModel, {namespace}),
        getResource(PodModel, {namespace}),
      ]} />
    </div>
    */}
    </ResourceRow>
  );
};

const VMList: React.FC = (props) => <List {...props} Header={VMHeader} Row={VMRow} />;
VMList.displayName = 'VMList';

const filters = undefined;
/* TODO(mlibra): introduce extension point for list.tsx and reenable here then.
Beyond recent kubevirt-web-ui functionality, user experience would be improved by full-featured VM status filtering.
To properly determine VM status, aditional objects (pods or CRs) needs to be accessed.
Recent filtering logic around list.tsx can handle just a single "listed" object (in our case, a VirtualMachine).
We will need to find a way how to supply additional resources there.

const filters = [{
  type: 'vm-status',
  selected: VM_SIMPLE_STATUS_ALL,
  reducer: getSimpleVmStatus,
  items: VM_SIMPLE_STATUS_ALL.map(status => ({ id: status, title: VM_SIMPLE_STATUS_TO_TEXT[status] }) ),
}];
*/

type VirtualMachinesPageProps = {
  namespace: string;
};

const getCreateProps = (namespace: string) => ({
  items: {
    // wizard: 'Create with Wizard', TODO(mlibra): migrate Create VM Dialog
    yaml: 'Create from YAML',
  },
  createLink: () => `/k8s/ns/${namespace || 'default'}/virtualmachines/~new/`,
  /* TODO(mlibra): migrate Create VM Dialog
  createLink: type => {
    switch (type) {
      case 'wizard':
       return () => openCreateVmWizard(this.props.namespace);
      default:
        return `/k8s/ns/${namespace || 'default'}/virtualmachines/~new/`;
    }
  },
  */
});

export const VirtualMachinesPage = (props: VirtualMachinesPageProps) => (
  <ListPage
    {...props}
    canCreate
    kind={VirtualMachineModel.kind}
    ListComponent={VMList}
    createProps={getCreateProps(props.namespace)}
    rowFilters={filters}
  />
);
