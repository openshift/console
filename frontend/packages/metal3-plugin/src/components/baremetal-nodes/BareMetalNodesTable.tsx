import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import NodeRoles from '@console/app/src/components/nodes/NodeRoles';
import { TableData, Table, RowFunctionArgs } from '@console/internal/components/factory';
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { MachineModel, NodeModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { DASH, getName, getUID, getNamespace, SecondaryStatus } from '@console/shared';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { BareMetalHostModel } from '../../models';
import { getHostBMCAddress } from '../../selectors';
import { baremetalNodeSecondaryStatus } from '../../status/baremetal-node-status';
import { BareMetalNodeBundle, BareMetalNodeListBundle, isCSRBundle, CSRBundle } from '../types';
import BareMetalNodeStatus from './BareMetalNodeStatus';
import CSRStatus from './CSRStatus';
import { menuActions } from './menu-actions';

import './baremetal-nodes-table.scss';

const tableColumnClasses = {
  name: '',
  status: 'pf-m-hidden pf-m-visible-on-sm',
  role: 'pf-m-hidden pf-m-visible-on-md pf-u-w-16-on-lg',
  machine: 'pf-m-hidden pf-m-visible-on-lg pf-u-w-16-on-lg',
  address: 'pf-m-hidden pf-m-visible-on-lg pf-u-w-16-on-lg',
  kebab: Kebab.columnClass,
};

const BareMetalNodesTableHeader = (t: TFunction) => () => [
  {
    title: t('metal3-plugin~Name'),
    sortField: 'name',
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
    title: t('metal3-plugin~Role'),
    sortField: 'machine.metadata.labels["machine.openshift.io/cluster-api-machine-role"]',
    transforms: [sortable],
    props: { className: tableColumnClasses.role },
  },
  {
    title: t('metal3-plugin~Machine'),
    sortField: "metadata.annotations['machine.openshift.io/machine']",
    transforms: [sortable],
    props: { className: tableColumnClasses.machine },
  },
  {
    title: t('metal3-plugin~Management Address'),
    sortField: 'host.spec.bmc.address',
    transforms: [sortable],
    props: { className: tableColumnClasses.address },
  },
  {
    title: '',
    props: { className: tableColumnClasses.kebab },
  },
];

const CSRTableRow: React.FC<BareMetalNodesTableRowProps<CSRBundle>> = ({ obj }) => {
  return (
    <>
      <TableData className={tableColumnClasses.name}>{obj.metadata.name}</TableData>
      <TableData className={tableColumnClasses.status}>
        <CSRStatus csr={obj.csr} title={obj.status.status} />
      </TableData>
      <TableData className={tableColumnClasses.role}>{DASH}</TableData>
      <TableData className={tableColumnClasses.machine}>{DASH}</TableData>
      <TableData className={tableColumnClasses.address}>{DASH}</TableData>
      <TableData className={tableColumnClasses.kebab} />
    </>
  );
};

type BareMetalNodesTableRowProps<R = CSRBundle | BareMetalNodeBundle> = {
  obj: R;
};

const BareMetalNodesTableRow: React.FC<BareMetalNodesTableRowProps<BareMetalNodeBundle>> = ({
  obj: { host, node, nodeMaintenance, machine, status, csr },
}) => {
  const { t } = useTranslation();
  const [hasNodeMaintenanceCapability, maintenanceModel] = useMaintenanceCapability();
  const nodeName = getName(node);
  const hostName = getName(host);
  const namespace = getNamespace(host);
  const address = getHostBMCAddress(host);
  const uid = getUID(node);

  return (
    <>
      <TableData className={tableColumnClasses.name}>
        {node ? (
          <ResourceLink kind="Node" name={nodeName} />
        ) : (
          <ResourceLink
            kind={referenceForModel(BareMetalHostModel)}
            name={hostName}
            namespace={namespace}
          />
        )}
      </TableData>
      <TableData className={tableColumnClasses.status}>
        <BareMetalNodeStatus {...status} nodeMaintenance={nodeMaintenance} csr={csr} />
        <SecondaryStatus status={baremetalNodeSecondaryStatus({ node, nodeMaintenance, host })} />
      </TableData>
      <TableData className={tableColumnClasses.role}>
        <NodeRoles node={node} />
      </TableData>
      <TableData className={tableColumnClasses.machine}>
        {machine ? (
          <ResourceLink
            kind={referenceForModel(MachineModel)}
            name={getName(machine)}
            namespace={getNamespace(machine)}
          />
        ) : (
          DASH
        )}
      </TableData>
      <TableData className={tableColumnClasses.address}>{address}</TableData>
      <TableData className={tableColumnClasses.kebab}>
        <Kebab
          options={menuActions.map((action) =>
            action(
              NodeModel,
              node,
              { csr },
              { nodeMaintenance, hasNodeMaintenanceCapability, maintenanceModel, t },
            ),
          )}
          key={`kebab-for-${uid}`}
          id={`kebab-for-${uid}`}
        />
      </TableData>
    </>
  );
};

const BMNRow: React.FC<RowFunctionArgs<BareMetalNodeListBundle>> = ({ obj }) =>
  isCSRBundle(obj) ? <CSRTableRow obj={obj} /> : <BareMetalNodesTableRow obj={obj} />;

type BareMetalNodesTableProps = React.ComponentProps<typeof Table> & {
  data: BareMetalNodeBundle[];
};

const BareMetalNodesTable: React.FC<BareMetalNodesTableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      defaultSortField="node.metadata.name"
      aria-label={t('metal3-plugin~Nodes')}
      Header={BareMetalNodesTableHeader(t)}
      Row={BMNRow}
      virtualize
    />
  );
};

export default BareMetalNodesTable;
