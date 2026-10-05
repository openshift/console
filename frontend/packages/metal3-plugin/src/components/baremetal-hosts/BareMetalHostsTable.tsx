import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import { DASH } from '@console/dynamic-plugin-sdk/src/app/constants';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
  ResourceFilters,
  ResourceMetadata,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { TableProps } from '@console/internal/components/factory/table';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { referenceForModel } from '@console/internal/module/k8s/k8s-ref';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { BMO_ENABLED_FLAG } from '../../features';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { BareMetalHostModel } from '../../models';
import { getHostBMCAddress, getHostVendorInfo } from '../../selectors/baremetal-hosts';
import type { BareMetalHostBundle } from '../types';
import BareMetalHostRole from './BareMetalHostRole';
import BareMetalHostSecondaryStatus from './BareMetalHostSecondaryStatus';
import BareMetalHostStatus from './BareMetalHostStatus';
import NodeLink from './NodeLink';
import { getHostFilterStatus, hostStatusFilter } from './table-filters';

const hostReference = referenceForModel(BareMetalHostModel);

/** Matches the `type` of {@link hostStatusFilter} so the filter round-trips through the URL. */
const HOST_STATUS_FILTER_ID = 'host-status';

type BareMetalHostFilters = ResourceFilters & { [HOST_STATUS_FILTER_ID]: string[] };

type BareMetalHostRowData = {
  bmoEnabled: boolean;
  maintenanceModel: ReturnType<typeof useMaintenanceCapability>[0];
};

const useBareMetalHostColumns = (): {
  columns: ConsoleDataViewColumn<BareMetalHostBundle>[];
} => {
  const { t } = useTranslation('metal3-plugin');
  const columns = useMemo(
    () => [
      {
        type: 'name' as const,
        id: 'name',
        title: t('Name'),
        sort: 'host.metadata.name',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'status',
        title: t('Status'),
        sort: 'status.status',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'node',
        title: t('Node'),
        sort: 'node.metadata.name',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'role',
        title: t('Role'),
        sort: 'machine.metadata.labels["machine.openshift.io/cluster-api-machine-role"]',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'address',
        title: t('Management Address'),
        sort: 'host.spec.bmc.address',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'serialNumber',
        title: t('Serial Number'),
        sort: 'host.status.hardware.systemVendor.serialNumber',
        props: { modifier: 'nowrap' as const },
      },
      { type: 'actions' as const, id: 'actions' },
    ],
    [t],
  );
  return { columns };
};

export const getBareMetalHostDataViewRows: GetDataViewRows<
  BareMetalHostBundle,
  BareMetalHostRowData
> = (data, columns) =>
  data.map(({ obj: { host, node, nodeMaintenance, machine, machineSet, status }, rowData }) => {
    const name = getName(host);
    const nodeName = getName(node);
    const { serialNumber } = getHostVendorInfo(host);
    const rowCells = {
      name: {
        cell: <ResourceLink kind={hostReference} name={name} namespace={getNamespace(host)} />,
      },
      status: {
        cell: (
          <>
            <BareMetalHostStatus {...status} nodeMaintenance={nodeMaintenance} host={host} />
            <BareMetalHostSecondaryStatus host={host} />
          </>
        ),
      },
      node: { cell: <NodeLink nodeName={nodeName} /> },
      role: { cell: <BareMetalHostRole machine={machine} node={node} /> },
      address: { cell: getHostBMCAddress(host) || DASH },
      serialNumber: { cell: serialNumber || DASH },
      actions: {
        cell: (
          <LazyActionMenu
            context={{
              [hostReference]: {
                host,
                machineSet,
                machine,
                bmoEnabled: rowData?.bmoEnabled,
                nodeName,
                status,
                maintenanceModel: rowData?.maintenanceModel,
                nodeMaintenance,
              },
            }}
          />
        ),
      },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

const getObjectMetadata = (bundle: BareMetalHostBundle): ResourceMetadata => ({
  name: getName(bundle.host),
  labels: bundle.host?.metadata?.labels,
});

type BareMetalHostsTableProps = TableProps & {
  data: BareMetalHostBundle[];
};

const BareMetalHostsTable: FC<BareMetalHostsTableProps> = (props) => {
  const { t } = useTranslation('metal3-plugin');
  const { columns } = useBareMetalHostColumns();
  const [maintenanceModel] = useMaintenanceCapability();
  const bmoEnabled = useFlag(BMO_ENABLED_FLAG);

  const statusFilterOptions = useMemo(
    () => hostStatusFilter(t).items.map(({ id, title }) => ({ value: id, label: title })),
    [t],
  );
  const initialFilters = useMemo<BareMetalHostFilters>(() => ({ [HOST_STATUS_FILTER_ID]: [] }), []);
  const additionalFilterNodes = useMemo(
    () => [
      <DataViewCheckboxFilter
        key={HOST_STATUS_FILTER_ID}
        filterId={HOST_STATUS_FILTER_ID}
        title={t('Status')}
        placeholder={t('Filter by status')}
        options={statusFilterOptions}
      />,
    ],
    [statusFilterOptions, t],
  );
  const matchesAdditionalFilters = useCallback(
    (bundle: BareMetalHostBundle, filters: BareMetalHostFilters) =>
      filters[HOST_STATUS_FILTER_ID].length === 0 ||
      filters[HOST_STATUS_FILTER_ID].includes(getHostFilterStatus(bundle)),
    [],
  );

  const customRowData = useMemo<BareMetalHostRowData>(
    () => ({ bmoEnabled, maintenanceModel }),
    [bmoEnabled, maintenanceModel],
  );

  return (
    <ConsoleDataView<BareMetalHostBundle, BareMetalHostRowData, BareMetalHostFilters>
      {...props}
      id={BareMetalHostModel}
      label={t('Bare Metal Hosts')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getBareMetalHostDataViewRows}
      getObjectMetadata={getObjectMetadata}
      customRowData={customRowData}
      initialFilters={initialFilters}
      additionalFilterNodes={additionalFilterNodes}
      matchesAdditionalFilters={matchesAdditionalFilters}
    />
  );
};

export default BareMetalHostsTable;
