import * as React from 'react';
import { Button, EmptyState, EmptyStateVariant } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import * as cx from 'classnames';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { RowFilter } from '@console/dynamic-plugin-sdk';
import {
  Table,
  TableProps,
  TableData,
  RowFunctionArgs,
  MultiListPage,
} from '@console/internal/components/factory';
import {
  FirehoseResourcesResult,
  humanizeBinaryBytes,
  Kebab,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel, NodeKind } from '@console/internal/module/k8s';
import { SubscriptionKind, SubscriptionModel } from '@console/operator-lifecycle-manager';
import { getNamespace, getNodeRole } from '@console/shared/';
import { LABEL_SELECTOR } from '../../constants/disks-list';
import { LocalVolumeDiscoveryResult } from '../../models';
import {
  updateLocalVolumeDiscovery,
  createLocalVolumeDiscovery,
} from '../local-volume-discovery/request';
import { DiskMetadata, DiskStates, LocalVolumeDiscoveryResultKind } from './types';

export const tableColumnClasses = [
  '',
  '',
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-2xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-lg'),
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const getRowProps = (obj) => ({
  id: obj.deviceID,
});

const DiskRow: React.FC<RowFunctionArgs<DiskMetadata>> = ({ obj }) => (
  <>
    <TableData className={tableColumnClasses[0]}>{obj.path}</TableData>
    <TableData className={tableColumnClasses[1]}>{obj.status.state}</TableData>
    <TableData className={tableColumnClasses[2]}>{obj.type || '-'}</TableData>
    <TableData className={cx(tableColumnClasses[3], 'co-break-word')}>{obj.model || '-'}</TableData>
    <TableData className={tableColumnClasses[4]}>
      {humanizeBinaryBytes(obj.size).string || '-'}
    </TableData>
    <TableData className={tableColumnClasses[5]}>{obj.fstype || '-'}</TableData>
  </>
);

const DisksList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();

  const diskHeader = () => [
    {
      title: t('lso-plugin~Name'),
      sortField: 'path',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('lso-plugin~Disk State'),
      sortField: 'status.state',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('lso-plugin~Type'),
      sortField: 'type',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('lso-plugin~Model'),
      sortField: 'model',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('lso-plugin~Capacity'),
      sortField: 'size',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('lso-plugin~Filesystem'),
      sortField: 'fstype',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
  ];

  return (
    <Table
      {...props}
      loadError={props.customData.error || props.loadError}
      loaded={props.customData.loaded && props.loaded}
      label={t('lso-plugin~Disks')}
      aria-label={t('lso-plugin~Disks List')}
      Header={diskHeader}
      Row={DiskRow}
      NoDataEmptyMsg={props.customData.EmptyMsg} // when no unfilteredData
      virtualize
      getRowProps={getRowProps}
    />
  );
};

export const NodesDisksListPage: React.FC<NodesDisksListPageProps> = ({
  obj,
  ListComponent = undefined,
}) => {
  const { t } = useTranslation();

  const [lvdRequestError, setError] = React.useState('');
  const [lvdRequestInProgress, setProgress] = React.useState(false);
  const [subscription, subscriptionLoaded, subscriptionLoadError] = useK8sWatchResource<
    SubscriptionKind[]
  >({
    kind: referenceForModel(SubscriptionModel),
    fieldSelector: 'metadata.name=local-storage-operator',
    isList: true,
  });

  const operatorNs = getNamespace(subscription[0]);
  const csvName = subscription?.[0]?.status?.installedCSV;
  const nodeName = obj.metadata.name;
  const nodeRole = getNodeRole(obj);
  const propName = `lvdr-${nodeName}`;

  const makeLocalVolumeDiscoverRequest = async (ns: string) => {
    const nodeNameByHostnameLabel = obj.metadata?.labels?.['kubernetes.io/hostname'];
    setProgress(true);
    try {
      await updateLocalVolumeDiscovery([nodeNameByHostnameLabel], ns, setError);
    } catch (error) {
      if (error?.response?.status === 404) {
        try {
          await createLocalVolumeDiscovery([nodeNameByHostnameLabel], ns, setError);
        } catch (createError) {
          setError(createError.message);
          setProgress(false);
        }
      } else {
        setError(error.message);
        setProgress(false);
      }
    }
  };

  const EmptyMsg = () => (
    <EmptyState variant={EmptyStateVariant.large}>
      <p>{t('lso-plugin~Disks Not Found')}</p>
      {csvName && operatorNs && nodeRole !== 'master' && (
        <Button
          isDisabled={lvdRequestInProgress}
          isLoading={lvdRequestInProgress}
          className="pf-u-mt-0"
          onClick={() => makeLocalVolumeDiscoverRequest(operatorNs)}
          variant="primary"
          id="yaml-create"
          data-test="yaml-create"
        >
          {t('lso-plugin~Discover Disks')}
        </Button>
      )}
    </EmptyState>
  );

  const diskFilters: RowFilter<DiskMetadata>[] = [
    {
      type: 'disk-state',
      filterGroupName: t('lso-plugin~Disk State'),
      reducer: (disk) => {
        return disk?.status?.state;
      },
      items: [
        { id: DiskStates.Available, title: t('lso-plugin~Available') },
        { id: DiskStates.NotAvailable, title: t('lso-plugin~NotAvailable') },
        { id: DiskStates.Unknown, title: t('lso-plugin~Unknown') },
      ],
      filter: (states, disk) => {
        if (!states || !states.selected || _.isEmpty(states.selected)) {
          return true;
        }
        const diskState = disk?.status.state;
        return states.selected.includes(diskState) || !_.includes(states.all, diskState);
      },
    },
  ];

  return (
    <MultiListPage
      canCreate={false}
      title={t('lso-plugin~Disks')}
      hideLabelFilter
      textFilter="node-disk-name"
      rowFilters={diskFilters}
      flatten={(
        resource: FirehoseResourcesResult<{ [key: string]: LocalVolumeDiscoveryResultKind }>,
      ) => resource[propName]?.data[0]?.status?.discoveredDevices ?? []}
      ListComponent={ListComponent ?? DisksList}
      resources={[
        {
          kind: referenceForModel(LocalVolumeDiscoveryResult),
          prop: propName,
          selector: { matchLabels: { [LABEL_SELECTOR]: nodeName } },
        },
      ]}
      customData={{
        node: nodeName,
        EmptyMsg,
        error: lvdRequestError || subscriptionLoadError,
        loaded: subscriptionLoaded,
      }}
    />
  );
};

export type NodesDisksListPageProps = {
  obj: NodeKind;
  ListComponent: React.ComponentType;
};
