import * as React from 'react';
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
import { getVMStatus } from '../../statuses/vm/vm';
import { vmStatusFilter } from './table-filters';
import { menuActions } from './menu-actions';

import './vm.scss';

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
  const lookupID = getBasicID(vm);

  const migration = migrationLookup[lookupID];
  const vmi = vmiLookup[lookupID];
  const vmStatus = getVMStatus({ vm, vmi, pods, migrations });

  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <ResourceLink kind={VirtualMachineModel.kind} name={name} namespace={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <VMStatus vm={vm} vmi={vmi} pods={pods} migrations={migrations} />
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
    <div className="kubevirt-vm-list">
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
    </div>
  );
};

VMList.displayName = 'VMList';

const getCreateProps = ({ namespace }: { namespace: string }) => {
  const items: any = {
    wizard: 'New with Wizard',
    wizardImport: 'Import with Wizard',
    yaml: 'New from YAML',
  };

  return {
    items,
    createLink: (itemName) => {
      const base = `/k8s/ns/${namespace || 'default'}/virtualmachines`;

      switch (itemName) {
        case 'wizard':
          return `${base}/~new-wizard`;
        case 'wizardImport':
          return `${base}/~new-wizard?mode=import`;
        case 'yaml':
        default:
          return `${base}/~new`;
      }
    },
  };
};

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

  const flatten = ({ vms }) => getLoadedData(vms, []);

  return (
    <MultiListPage
      {...props}
      createButtonText="Create Virtual Machine"
      canCreate
      title={VirtualMachineModel.labelPlural}
      rowFilters={[vmStatusFilter]}
      ListComponent={VMList}
      createProps={getCreateProps({ namespace })}
      resources={resources}
      flatten={flatten}
      label={VirtualMachineModel.labelPlural}
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
  hasCreateVMWizardsSupport: boolean;
};
