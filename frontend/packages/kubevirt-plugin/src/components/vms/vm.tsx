import * as React from 'react';
import * as _ from 'lodash';
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
  Status,
} from '@console/shared';
import { NamespaceModel, PodModel, NodeModel } from '@console/internal/models';
import { Table, MultiListPage, TableRow, TableData } from '@console/internal/components/factory';
import { FirehoseResult, Kebab, ResourceLink } from '@console/internal/components/utils';
import { fromNow } from '@console/internal/components/utils/datetime';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { getPhase } from '@console/noobaa-storage-plugin/src/utils';
import { VMStatus } from '../vm-status/vm-status';
import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { ResourceLinkPopover } from '../resource-link-popover';
import { VMIKind, VMKind } from '../../types';
import { getMigrationVMIName, isMigrating } from '../../selectors/vmi-migration';
import { getBasicID, getLoadedData, getResource } from '../../utils';
import { getVMStatus } from '../../statuses/vm/vm';
import { getVmiIpAddresses, getVMINodeName } from '../../selectors/vmi';
import { vmStatusFilter } from './table-filters';
import { menuActions } from './menu-actions';

import './vm.scss';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-2', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-3', 'col-xs-3'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-3', 'col-xs-3'),
  Kebab.columnClass,
];

export const getStatus = (obj: VMKind | VMIKind) =>
  obj.kind === VirtualMachineModel.kind ? getVMStatus({ vm: obj as VMKind }) : getPhase(obj);

const VMHeader = () =>
  dimensifyHeader(
    [
      {
        title: 'Name',
        sortField: 'metadata.name',
        transforms: [sortable],
      },
      {
        title: 'Instance',
      },
      {
        title: 'Namespace',
        sortField: 'metadata.namespace',
        transforms: [sortable],
      },
      {
        title: 'Status',
        sortFunc: 'getStatus',
        transforms: [sortable],
      },
      {
        title: 'Created',
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
      },
      {
        title: 'Node',
      },
      {
        title: 'IP Address',
      },
      {
        title: '',
      },
    ],
    tableColumnClasses,
  );

const VMRow: React.FC<VMRowProps> = ({
  obj,
  customData: { pods, migrations, vmiLookup, migrationLookup },
  index,
  key,
  style,
}) => {
  const dimensify = dimensifyRow(tableColumnClasses);
  const name = getName(obj);
  const namespace = getNamespace(obj);
  const uid = getUID(obj);
  const lookupID = getBasicID(obj);
  const migration = migrationLookup[lookupID];

  let vm: VMKind;
  let vmi: VMIKind;
  let status: React.ReactNode;
  let vmStatus;
  let actions = [Kebab.factory.ModifyLabels, Kebab.factory.ModifyAnnotations, Kebab.factory.Delete];

  if (obj.kind === VirtualMachineModel.kind) {
    vm = obj as VMKind;
    vmi = vmiLookup[lookupID];
    vmStatus = getVMStatus({ vm: vm as VMKind, vmi, pods, migrations });
    status = <VMStatus vm={vm} vmi={vmi} pods={pods} migrations={migrations} />;
    actions = menuActions;
  } else {
    vmi = obj as VMIKind;
    status = <Status status={getPhase(vmi)} />;
  }

  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        {vm ? (
          <ResourceLink kind={VirtualMachineModel.kind} name={name} namespace={namespace} />
        ) : (
          <ResourceLinkPopover
            kind={VirtualMachineInstanceModel.kind}
            name={name}
            namespace={namespace}
            isDisabled
            message="No VM"
            linkMessage="VMI Dedatails page"
          >
            <div>
              This VMI doesn’t have an owner VM since it might have been created outside of the
              console.
            </div>
          </ResourceLinkPopover>
        )}
      </TableData>
      <TableData className={dimensify()}>
        {vmi ? (
          <ResourceLink
            kind={VirtualMachineInstanceModel.kind}
            name={getName(vmi)}
            namespace={namespace}
          />
        ) : (
          <ResourceLinkPopover
            kind={VirtualMachineModel.kind}
            name={name}
            namespace={namespace}
            isDisabled
            message="No Instance"
            linkMessage="VM Dedatails page"
          >
            <div>
              This VMI is currently off.
              <br />
              For further details please click its owner VM link below.
            </div>
          </ResourceLinkPopover>
        )}
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={dimensify()}>{status}</TableData>
      <TableData className={dimensify()}>{fromNow(obj.metadata.creationTimestamp)}</TableData>
      <TableData className={dimensify()}>
        {getVMINodeName(vmi) && (
          <ResourceLink kind={NodeModel.kind} name={getVMINodeName(vmi)} namespace={namespace} />
        )}
      </TableData>
      <TableData className={dimensify()}>{vmi && getVmiIpAddresses(vmi)}</TableData>
      <TableData className={dimensify(true)}>
        <Kebab
          options={actions.map((action) =>
            action(vm ? VirtualMachineModel : VirtualMachineInstanceModel, obj, {
              vmStatus,
              migration,
              vmi,
            }),
          )}
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
  const { namespace, skipAccessReview } = props;

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

  const flatten = ({ vms, vmis }) =>
    _.unionBy(
      getLoadedData(vms, []),
      getLoadedData(vmis, []),
      (obj) => `${getName(obj)}-${getNamespace(obj)}`,
    );

  const createAccessReview = skipAccessReview ? null : { model: VirtualMachineModel, namespace };

  return (
    <MultiListPage
      {...props}
      createAccessReview={createAccessReview}
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
  obj: VMKind | VMIKind;
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
  data: (VMKind | VMIKind)[];
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
  skipAccessReview?: boolean;
};
