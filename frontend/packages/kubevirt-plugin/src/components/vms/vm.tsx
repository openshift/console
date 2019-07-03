import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import {
  getResource,
  getVmStatus,
  VmStatus,
  // getSimpleVmStatus,
  // VM_SIMPLE_STATUS_ALL,
  // VM_SIMPLE_STATUS_TO_TEXT,
  //  DASHES,
} from 'kubevirt-web-ui-components';
import { getName, getNamespace, getUID } from '@console/shared';

import { NamespaceModel, PodModel } from '@console/internal/models';
import { Table, MultiListPage, TableRow, TableData } from '@console/internal/components/factory';
import { FirehoseResult, Kebab, ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';

import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';

import { K8sEntityMap, VMIKind, VMKind } from '../../types';
import { menuActions } from './menu-actions';
import { createLookup, getLookupId } from '../../utils';
import { getMigrationVMIName, isMigrating } from '../../selectors/vmi-migration';
import { vmStatusFilter } from './table-filters';
import { dimensifyHeader, dimensifyRow } from '../../utils/table';

import { openCreateVmWizard } from '../modals';

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
  const vmStatus = getVmStatus(vm, pods, migrations);
  const lookupId = getLookupId(vm);

  const migration = migrationLookup[lookupId];
  const vmi = vmiLookup[lookupId];

  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <ResourceLink kind={VirtualMachineModel.kind} name={name} namespace={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <VmStatus vm={vm} pods={pods} migrations={migrations} />
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
      customData={{
        pods: resources.pods.data || [],
        migrations: resources.migrations.data || [],
        vmiLookup: createLookup(resources.vmis),
        migrationLookup: createLookup(
          resources.migrations,
          (m) => isMigrating(m) && `${getNamespace(m)}-${getMigrationVMIName(m)}`,
        ),
      }}
    />
  );
};

VMList.displayName = 'VMList';

const getCreateProps = (namespace: string) => ({
  items: {
    wizard: 'Create with Wizard',
    yaml: 'Create from YAML',
  },
  createLink: () => `/k8s/ns/${namespace || 'default'}/virtualmachines/~new/`, // covers 'yaml' and default
  action: (itemName) => (itemName === 'wizard' ? () => openCreateVmWizard(namespace) : null),
});

export const VirtualMachinesPage: React.FC<VirtualMachinesPageProps> = (props) => {
  const { namespace } = props;

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

  const flatten = ({ vms: { data: vmsData, loaded, loadError } }) =>
    loaded && !loadError ? vmsData : [];

  return (
    <MultiListPage
      {...props}
      canCreate
      title={VirtualMachineModel.labelPlural}
      rowFilters={[vmStatusFilter]}
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
};
