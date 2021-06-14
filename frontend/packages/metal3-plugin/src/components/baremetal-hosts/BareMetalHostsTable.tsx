import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  TableRow,
  TableData,
  Table,
  RowFunction,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { getName, getUID, getNamespace, DASH } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { BMO_ENABLED_FLAG } from '../../features';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { BareMetalHostModel } from '../../models';
import { getHostBMCAddress, getHostVendorInfo } from '../../selectors';
import { BareMetalHostBundle } from '../types';
import BareMetalHostRole from './BareMetalHostRole';
import BareMetalHostSecondaryStatus from './BareMetalHostSecondaryStatus';
import BareMetalHostStatus from './BareMetalHostStatus';
import { menuActions } from './host-menu-actions';
import NodeLink from './NodeLink';

const tableColumnClasses = {
  name: classNames('col-lg-2', 'col-md-4', 'col-sm-12', 'col-xs-12'),
  status: classNames('col-lg-2', 'col-md-4', 'col-sm-6', 'hidden-xs'),
  node: classNames('col-lg-2', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  role: classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  address: classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  serialNumber: classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  kebab: Kebab.columnClass,
};

const HostsTableHeader = (t: TFunction) => () => [
  {
    title: t('metal3-plugin~Name'),
    sortField: 'host.metadata.name',
    transforms: [sortable],
    props: { className: tableColumnClasses.name },
  },
  {
    title: t('metal3-plugin~Status'),
    sortField: 'status.status',
    transforms: [sortable],
    props: { className: tableColumnClasses.status },
  },
  {
    title: t('metal3-plugin~Node'),
    sortField: 'node.metadata.name',
    transforms: [sortable],
    props: { className: tableColumnClasses.node },
  },
  {
    title: t('metal3-plugin~Role'),
    sortField: 'machine.metadata.labels["machine.openshift.io/cluster-api-machine-role"]',
    transforms: [sortable],
    props: { className: tableColumnClasses.role },
  },
  {
    title: t('metal3-plugin~Management Address'),
    sortField: 'host.spec.bmc.address',
    transforms: [sortable],
    props: { className: tableColumnClasses.address },
  },
  {
    title: t('metal3-plugin~Serial Number'),
    sortField: 'host.status.hardware.systemVendor.serialNumber',
    transforms: [sortable],
    props: { className: tableColumnClasses.serialNumber },
  },
  {
    title: '',
    props: { className: tableColumnClasses.kebab },
  },
];

const HostsTableRow: React.FC<RowFunctionArgs<BareMetalHostBundle>> = ({
  obj: { host, node, nodeMaintenance, machine, machineSet, status },
  index,
  key,
  style,
}) => {
  const { t } = useTranslation();
  const [hasNodeMaintenanceCapability, maintenanceModel] = useMaintenanceCapability();
  const bmoEnabled = useFlag(BMO_ENABLED_FLAG);
  const name = getName(host);
  const namespace = getNamespace(host);
  const address = getHostBMCAddress(host);
  const uid = getUID(host);
  const nodeName = getName(node);
  const { serialNumber } = getHostVendorInfo(host);

  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses.name}>
        <ResourceLink
          kind={referenceForModel(BareMetalHostModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses.status}>
        <BareMetalHostStatus {...status} nodeMaintenance={nodeMaintenance} host={host} />
        <BareMetalHostSecondaryStatus host={host} />
      </TableData>
      <TableData className={tableColumnClasses.node}>
        <NodeLink nodeName={nodeName} />
      </TableData>
      <TableData className={tableColumnClasses.role}>
        <BareMetalHostRole machine={machine} node={node} />
      </TableData>
      <TableData className={tableColumnClasses.address}>{address || DASH}</TableData>
      <TableData className={tableColumnClasses.serialNumber}>{serialNumber || DASH}</TableData>
      <TableData className={tableColumnClasses.kebab}>
        <Kebab
          options={menuActions.map((action) =>
            action(BareMetalHostModel, host, {
              nodeMaintenance,
              nodeName,
              hasNodeMaintenanceCapability,
              machine,
              machineSet,
              status,
              bmoEnabled,
              maintenanceModel,
              t,
            }),
          )}
          key={`kebab-for-${uid}`}
          id={`kebab-for-${uid}`}
        />
      </TableData>
    </TableRow>
  );
};

type BareMetalHostsTableProps = React.ComponentProps<typeof Table> & {
  data: BareMetalHostBundle[];
};

const BareMetalHostsTable: React.FC<BareMetalHostsTableProps> = (props) => {
  const { t } = useTranslation();
  const row = React.useCallback<RowFunction<BareMetalHostBundle>>(
    (rowProps) => <HostsTableRow {...rowProps} />,
    [],
  );
  return (
    <Table
      {...props}
      defaultSortField="host.metadata.name"
      aria-label={t('metal3-plugin~Bare Metal Hosts')}
      Header={HostsTableHeader(t)}
      Row={row}
      virtualize
    />
  );
};

export default BareMetalHostsTable;
