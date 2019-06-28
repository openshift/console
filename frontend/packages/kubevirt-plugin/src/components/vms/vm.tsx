import * as React from 'react';
import * as classNames from 'classnames';

import {
  getResource,
  // VmStatus,
  // getSimpleVmStatus,
  // VM_SIMPLE_STATUS_ALL,
  // VM_SIMPLE_STATUS_TO_TEXT,
  //  DASHES,
} from 'kubevirt-web-ui-components';
import { getName, getNamespace, getUid } from '@console/shared';

import { NamespaceModel, PodModel } from '@console/internal/models';
import { Table, MultiListPage, TableRow, TableData } from '@console/internal/components/factory';
import { FirehoseResult, Kebab, ResourceLink } from '@console/internal/components/utils';
// import { actions } from '../../module/okdk8s';

import { sortable } from '@patternfly/react-table';
import { PodKind } from '@console/internal/module/k8s';
import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineModel,
  // VirtualMachineInstanceModel,
} from '../../models';

import { VMKind } from '../../types';
import { menuActions } from './menu-actions';

// import { openCreateVmWizard } from '../modals/create-vm-modal';

const tableColumnClasses = [
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-4', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  Kebab.columnClass,
];

const VMHeader = () => [
  {
    title: 'Name',
    sortField: 'metadata.name',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Namespace',
    sortField: 'metadata.namespace',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  },
  // {
  //   title: 'Status',
  //   props: { className: tableColumnClasses[2] },
  // },
  {
    title: '',
    props: { className: Kebab.columnClass, props: { className: tableColumnClasses[3] } },
  },
];

const VMRow: React.FC<VMRowProps> = ({ obj: vm, customData, index, key, style }) => {
  const name = getName(vm);
  const namespace = getNamespace(vm);
  const uid = getUid(vm);

  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={VirtualMachineModel.kind} name={name} namespace={namespace} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      {/* TODO(mlibra): migrate VM status in a follow-up */}
      <TableData className={Kebab.columnClass}>
        <Kebab
          options={menuActions.map((action) => action(VirtualMachineModel, vm, customData))}
          key={`kebab-for-${uid}`}
          id={`kebab-for-${uid}`}
        />
      </TableData>
    </TableRow>
  );
};

const VMList: React.FC<React.ComponentProps<typeof Table> & VMListProps> = (props) => {
  const { resources } = props;
  return (
    <Table
      {...props}
      aria-label={VirtualMachineModel.labelPlural}
      Header={VMHeader}
      Row={VMRow}
      customData={{
        pods: resources.pods.data || [],
        migrations: resources.migrations.data || [],
      }}
    />
  );
};

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

export const VirtualMachinesPage: React.FC<VirtualMachinesPageProps> = (props) => {
  const { namespace } = props;
  const resources = [
    getResource(VirtualMachineModel, { namespace, prop: 'vms' }),
    getResource(PodModel, { namespace, prop: 'pods' }),
    getResource(VirtualMachineInstanceMigrationModel, { namespace, prop: 'migrations' }),
  ];

  const flatten = ({ vms: { data: vmsData, loaded, loadError } }) =>
    loaded && !loadError ? vmsData : [];

  return (
    <MultiListPage
      {...props}
      canCreate
      title={VirtualMachineModel.labelPlural}
      rowFilters={filters}
      ListComponent={VMList}
      createProps={getCreateProps(props.namespace)}
      resources={resources}
      flatten={flatten}
    />
  );
};

type VMRowProps = {
  obj: VMKind;
  index: number;
  key: string;
  style: object;
  customData: {
    pods: PodKind[];
    migrations: any[];
  };
};

type VMListProps = {
  data: VMKind[];
  resources: {
    pods: FirehoseResult<PodKind[]>;
    migrations: FirehoseResult<any[]>;
  };
};

type VirtualMachinesPageProps = {
  namespace: string;
};
