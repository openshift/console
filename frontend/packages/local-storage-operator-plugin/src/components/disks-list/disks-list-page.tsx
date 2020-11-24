import * as React from 'react';
import * as _ from 'lodash';
import * as cx from 'classnames';
import { Link } from 'react-router-dom';
import { Button, EmptyState, EmptyStateVariant } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import {
  Table,
  TableProps,
  TableRow,
  TableData,
  RowFunction,
  MultiListPage,
} from '@console/internal/components/factory';
import {
  FirehoseResult,
  humanizeBinaryBytes,
  Kebab,
  LoadingInline,
} from '@console/internal/components/utils';
import { referenceForModel, NodeKind } from '@console/internal/module/k8s';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SubscriptionKind, SubscriptionModel } from '@console/operator-lifecycle-manager';
import { getNamespace, getNodeRole } from '@console/shared/';
import { LocalVolumeDiscovery, LocalVolumeDiscoveryResult } from '../../models';
import { LABEL_SELECTOR } from '../../constants/disks-list';
import { DiskMetadata, DiskStates, LocalVolumeDiscoveryResultKind } from './types';

export const diskFilters: RowFilter[] = [
  {
    type: 'disk-state',
    filterGroupName: 'Disk State',
    reducer: (disk: DiskMetadata) => {
      return disk?.status?.state;
    },
    items: [
      { id: DiskStates.Available, title: DiskStates.Available },
      { id: DiskStates.NotAvailable, title: DiskStates.NotAvailable },
      { id: DiskStates.Unknown, title: DiskStates.Unknown },
    ],
    filter: (
      states: { all: (keyof typeof DiskStates)[]; selected: Set<keyof typeof DiskStates> },
      disk: DiskMetadata,
    ) => {
      if (!states || !states.selected || _.isEmpty(states.selected)) {
        return true;
      }
      const diskState = disk?.status.state;
      return states.selected.has(diskState) || !_.includes(states.all, diskState);
    },
  },
];

export const tableColumnClasses = [
  '',
  '',
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-2xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-lg'),
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const diskHeader = () => [
  {
    title: 'Name',
    sortField: 'path',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Disk State',
    sortField: 'status.state',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Type',
    sortField: 'type',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'Model',
    sortField: 'model',
    transforms: [sortable],
    props: { className: tableColumnClasses[3] },
  },
  {
    title: 'Capacity',
    sortField: 'size',
    transforms: [sortable],
    props: { className: tableColumnClasses[4] },
  },
  {
    title: 'Filesystem',
    sortField: 'fstype',
    transforms: [sortable],
    props: { className: tableColumnClasses[5] },
  },
];

const diskRow: RowFunction<DiskMetadata> = ({ obj, index, key, style }) => (
  <TableRow id={obj.deviceID} index={index} trKey={key} style={style}>
    <TableData className={tableColumnClasses[0]}>{obj.path}</TableData>
    <TableData className={tableColumnClasses[1]}>{obj.status.state}</TableData>
    <TableData className={tableColumnClasses[2]}>{obj.type || '-'}</TableData>
    <TableData className={cx(tableColumnClasses[3], 'co-break-word')}>{obj.model || '-'}</TableData>
    <TableData className={tableColumnClasses[4]}>
      {humanizeBinaryBytes(obj.size).string || '-'}
    </TableData>
    <TableData className={tableColumnClasses[5]}>{obj.fstype || '-'}</TableData>
  </TableRow>
);

const DisksList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label="Disks List"
    Header={diskHeader}
    Row={diskRow}
    NoDataEmptyMsg={props.customData.EmptyMsg} // when no unfilteredData
    virtualize
  />
);

export const NodesDisksListPage: React.FC<NodesDisksListPageProps> = ({
  obj,
  ListComponent = undefined,
}) => {
  const [subscription, subscriptionLoaded] = useK8sWatchResource<SubscriptionKind[]>({
    kind: referenceForModel(SubscriptionModel),
    fieldSelector: 'metadata.name=local-storage-operator',
    isList: true,
  });

  const operatorNs = getNamespace(subscription[0]);
  const csvName = subscription?.[0]?.status?.installedCSV;
  const nodeName = obj.metadata.name;
  const nodeRole = getNodeRole(obj);
  const propName = `lvdr-${nodeName}`;

  const EmptyMsg = () => (
    <EmptyState variant={EmptyStateVariant.large}>
      {!subscriptionLoaded ? (
        <LoadingInline />
      ) : (
        <>
          <p>Disks Not Found</p>
          {csvName && operatorNs && nodeRole !== 'master' && (
            <Link
              className="co-m-primary-action"
              to={`/k8s/ns/${operatorNs}/clusterserviceversions/${csvName}/${referenceForModel(
                LocalVolumeDiscovery,
              )}/~new`}
            >
              <Button variant="primary" id="yaml-create" data-test="yaml-create">
                Discover Disks
              </Button>
            </Link>
          )}
        </>
      )}
    </EmptyState>
  );

  return (
    <MultiListPage
      canCreate={false}
      title="Disks"
      hideLabelFilter
      textFilter="node-disk-name"
      rowFilters={diskFilters}
      flatten={(resource: FirehoseResult<LocalVolumeDiscoveryResultKind>) =>
        resource[propName]?.data[0]?.status?.discoveredDevices ?? []
      }
      ListComponent={ListComponent ?? DisksList}
      resources={[
        {
          kind: referenceForModel(LocalVolumeDiscoveryResult),
          prop: propName,
          selector: { [LABEL_SELECTOR]: nodeName },
        },
      ]}
      customData={{ node: nodeName, EmptyMsg }}
    />
  );
};

export type NodesDisksListPageProps = {
  obj: NodeKind;
  ListComponent: React.ComponentType;
};
