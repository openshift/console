import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import {
  getName,
  getNamespace,
  getUID,
  createLookup,
  K8sEntityMap,
  dimensifyHeader,
  dimensifyRow,
} from '@console/shared';
import { NamespaceModel, PodModel } from '@console/internal/models';
import { Table, MultiListPage, TableRow, TableData } from '@console/internal/components/factory';
import { FirehoseResult, Kebab, ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { VMStatus } from '../vm-status/vm-status';
import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { VMIKind, VMKind } from '../../types';
import { getMigrationVMIName, isMigrating } from '../../selectors/vmi-migration';
import { getBasicID, getLoadedData, getResource } from '../../utils';
import { openCreateVmWizard } from '../modals';
import { getVMStatus } from '../../statuses/vm/vm';
import { getCreateVMWizards } from '../create-vm-wizard/selectors/selectors';
import { vmStatusFilter } from './table-filters';
import { menuActions } from './menu-actions';

const tableColumnClasses = [
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-4', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  Kebab.columnClass,
];

const VMHeader = () =>
  dimensifyHeader(
    [
      {
        title: 'Name',
        sortField: 'metadata.name',
        transforms: [sortable],
      },
      {
        title: 'Namespace',
        sortField: 'metadata.namespace',
        transforms: [sortable],
      },
      {
        title: 'Status',
        sortFunc: 'string',
        transforms: [sortable],
      },
      {
        title: '',
      },
    ],
    tableColumnClasses,
  );

const VMRow: React.FC<VMRowProps> = ({
  obj: vm,
  customData: { pods, migrations, vmiLookup, migrationLookup },
  index,
  key,
  style,
}) => {
  const dimensify = dimensifyRow(tableColumnClasses);
  const name = getName(vm);
  const namespace = getNamespace(vm);
  const uid = getUID(vm);
  const vmStatus = getVMStatus(vm, pods, migrations);
  const lookupID = getBasicID(vm);

  const migration = migrationLookup[lookupID];
  const vmi = vmiLookup[lookupID];

  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <ResourceLink kind={VirtualMachineModel.kind} name={name} namespace={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <VMStatus vm={vm} pods={pods} migrations={migrations} />
      </TableData>
      <TableData className={dimensify(true)}>
        <Kebab
          options={menuActions.map((action) => {
            return action(VirtualMachineModel, vm, {
              vmStatus,
              migration,
              vmi,
            });
          })}
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
      virtualize
      customData={{
        pods: getLoadedData(resources.pods, []),
        migrations: getLoadedData(resources.migrations, []),
        vmiLookup: createLookup(resources.vmis, getBasicID),
        migrationLookup: createLookup(
          resources.migrations,
          (m) => isMigrating(m) && `${getNamespace(m)}-${getMigrationVMIName(m)}`,
        ),
      }}
    />
  );
};

VMList.displayName = 'VMList';

const getCreateProps = ({
  namespace,
  hasCreateVMWizardsSupport,
}: {
  namespace: string;
  hasCreateVMWizardsSupport: boolean;
}) => {
  const items: any = {
    wizard: 'Create with Wizard',
    yaml: 'Create from YAML',
  };

  if (hasCreateVMWizardsSupport) {
    items.wizardNew = 'Create with New Wizard';
  }

  return {
    items,
    createLink: (itemName) =>
      `/k8s/ns/${namespace || 'default'}/virtualmachines/${
        !hasCreateVMWizardsSupport || itemName === 'yaml' ? '~new' : '~new-wizard'
      }`, // covers 'yaml', new-wizard and default
    action: (itemName) => (itemName === 'wizard' ? () => openCreateVmWizard(namespace) : null),
  };
};

const VirtualMachinesPageComponent: React.FC<VirtualMachinesPageProps> = (props) => {
  const { namespace, hasCreateVMWizardsSupport } = props;

  const resources = [
    getResource(VirtualMachineModel, { namespace, prop: 'vms' }),
    getResource(PodModel, { namespace, prop: 'pods' }),
    getResource(VirtualMachineInstanceMigrationModel, { namespace, prop: 'migrations' }),
    getResource(VirtualMachineInstanceModel, {
      namespace,
      prop: 'vmis',
      optional: true,
    }),
  ];

  const flatten = ({ vms }) => getLoadedData(vms, []);

  return (
    <MultiListPage
      {...props}
      canCreate
      title={VirtualMachineModel.labelPlural}
      rowFilters={[vmStatusFilter]}
      ListComponent={VMList}
      createProps={getCreateProps({ namespace, hasCreateVMWizardsSupport })}
      resources={resources}
      flatten={flatten}
      label={VirtualMachineModel.labelPlural}
    />
  );
};

export const VirtualMachinesPage = connect((state) => ({
  hasCreateVMWizardsSupport: !!getCreateVMWizards(state),
}))(VirtualMachinesPageComponent);

type VMRowProps = {
  obj: VMKind;
  index: number;
  key: string;
  style: object;
  customData: {
    pods: PodKind[];
    migrations: K8sResourceKind[];
    migrationLookup: K8sEntityMap<VMIKind>;
    vmiLookup: K8sEntityMap<VMIKind>;
  };
};

type VMListProps = {
  data: VMKind[];
  resources: {
    pods: FirehoseResult<PodKind[]>;
    migrations: FirehoseResult<K8sResourceKind[]>;
    vmis: FirehoseResult<VMIKind[]>;
  };
};

type VirtualMachinesPageProps = {
  namespace: string;
  obj: VMKind;
  hasCreateVMWizardsSupport: boolean;
};
