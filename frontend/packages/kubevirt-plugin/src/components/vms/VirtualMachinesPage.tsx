import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { RowFilter, RowProps, TableColumn } from '@console/dynamic-plugin-sdk';
import { useListPageFilter } from '@console/internal/components/factory/ListPage/filter-hook';
import ListPageBody from '@console/internal/components/factory/ListPage/ListPageBody';
import ListPageFilter from '@console/internal/components/factory/ListPage/ListPageFilter';
import ListPageHeader from '@console/internal/components/factory/ListPage/ListPageHeader';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import VirtualizedTable, {
  TableData,
} from '@console/internal/components/factory/Table/VirtualizedTable';
import { Kebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { Selector, referenceFor } from '@console/internal/module/k8s';
import { LazyActionMenu, getOwnerReferences } from '@console/shared';
import { StatusSimpleLabel } from '../../constants';
import { VMStatusSimpleLabel, VM_STATUS_SIMPLE_LABELS } from '../../constants/vm/vm-status';
import { VirtualMachineModel } from '../../models';
import { isVM } from '../../selectors/check-type';
import { getVmiIpAddresses, getVMINodeName } from '../../selectors/vmi';
import { VMIKind, VMKind } from '../../types';
import { VirtualMachinesPageActions } from './VirtualMachinesPageActions';
import { VirtualMachinesPageConditions } from './VirtualMachinesPageConditions';
import { VirtualMachinesEmptyPage } from './VirtualMachinesPageEmpty';
import { VirtualMachinesPageStatus } from './VirtualMachinesPageStatus';
import VMIP from './VMIP';

import './virtualization.scss';

const vmPhase = (vm: VMKind | VMIKind) =>
  vm.status?.printableStatus || vm.status?.phase || 'Unknown';

const vmPhaseGroups = (status: string): string => {
  if (status in VMStatusSimpleLabel || status in StatusSimpleLabel) {
    return status;
  }

  if (status.toLowerCase().includes('error')) {
    return 'Error';
  }

  if (status.toLowerCase().includes('pending') || status.toLowerCase().includes('provisioning')) {
    return StatusSimpleLabel.Pending;
  }

  return 'Unkown';
};

export const menuActions = [
  ...Kebab.getExtensionsActionsForKind(VirtualMachineModel),
  ...Kebab.factory.common,
];

// t('kubevirt-plugin~Name')
// t('kubevirt-plugin~Namespace')
// t('kubevirt-plugin~Status')
// t('kubevirt-plugin~Conditions')
// t('kubevirt-plugin~Node')
// t('kubevirt-plugin~Created')
// t('kubevirt-plugin~IP address')

const vmColumnInfo = Object.freeze({
  name: {
    classes: '',
    id: 'name',
    title: 'kubevirt-plugin~Name',
  },
  namespace: {
    classes: '',
    id: 'namespace',
    title: 'kubevirt-plugin~Namespace',
  },
  status: {
    classes: '',
    id: 'status',
    title: 'kubevirt-plugin~Status',
  },
  conditions: {
    classes: '',
    id: 'conditions',
    title: 'kubevirt-plugin~Conditions',
  },
  created: {
    classes: classNames('pf-u-w-10-on-2xl'),
    id: 'created',
    title: 'kubevirt-plugin~Created',
  },
  node: {
    classes: '',
    id: 'node',
    title: 'kubevirt-plugin~Node',
  },
  ipaddress: {
    classes: '',
    id: 'ipaddress',
    title: 'kubevirt-plugin~IP address',
  },
});

const vmiGroupVersionKind = {
  version: 'v1',
  kind: 'VirtualMachineInstance',
  group: 'kubevirt.io',
};

const vmGroupVersionKind = {
  version: 'v1',
  kind: 'VirtualMachine',
  group: 'kubevirt.io',
};
const columnManagementID = 'kubevirt.io~v1~VirtualMachine';

const getColumns = (t: TFunction): TableColumn<VMKind | VMIKind>[] => [
  {
    title: t(vmColumnInfo.name.title),
    id: vmColumnInfo.name.id,
    sort: 'metadata.name',
    transforms: [sortable],
    props: { className: vmColumnInfo.name.classes },
  },
  {
    title: t(vmColumnInfo.namespace.title),
    id: vmColumnInfo.namespace.id,
    sort: 'metadata.namespace',
    transforms: [sortable],
    props: { className: vmColumnInfo.namespace.classes },
  },
  {
    title: t(vmColumnInfo.status.title),
    id: vmColumnInfo.status.id,
    sort: 'status.printableStatus',
    transforms: [sortable],
    props: { className: vmColumnInfo.status.classes },
  },
  {
    title: t(vmColumnInfo.conditions.title),
    id: vmColumnInfo.conditions.id,
    sort: 'status.printableStatus',
    transforms: [sortable],
    props: { className: vmColumnInfo.conditions.classes },
  },
  {
    title: t(vmColumnInfo.created.title),
    id: vmColumnInfo.created.id,
    sort: 'metadata.creationTimestamp',
    transforms: [sortable],
    props: { className: vmColumnInfo.created.classes },
  },
  {
    title: t(vmColumnInfo.node.title),
    id: vmColumnInfo.node.id,
    sort: 'spec.nodeName',
    transforms: [sortable],
    props: { className: vmColumnInfo.node.classes },
  },
  {
    title: t(vmColumnInfo.ipaddress.title),
    id: vmColumnInfo.ipaddress.id,
    sort: 'status.podIP',
    transforms: [sortable],
    props: { className: vmColumnInfo.ipaddress.classes },
  },
  {
    title: '',
    id: '',
    props: { className: Kebab.columnClass },
  },
];

const VMTableRow: React.FC<RowProps<VMKind | VMIKind>> = ({ obj: vm, activeColumnIDs }) => {
  const { name, namespace, creationTimestamp } = vm.metadata;
  const [vmi, vmiLoaded, vmiLoadError] = useK8sWatchResource<VMIKind>({
    groupVersionKind: {
      version: 'v1',
      kind: 'VirtualMachineInstance',
      group: 'kubevirt.io',
    },
    name,
    namespace,
    isList: false,
  });
  const [vmResource, vmLoaded, vmLoadError] = useK8sWatchResource<VMIKind>({
    groupVersionKind: {
      version: 'v1',
      kind: 'VirtualMachine',
      group: 'kubevirt.io',
    },
    name,
    namespace,
    isList: false,
  });

  const groupVersionKind = isVM(vm) ? vmGroupVersionKind : vmiGroupVersionKind;
  const phase = vmPhase(vm);
  const resourceKind = referenceFor(vm);
  const context = { [resourceKind]: vm };

  const node = vmiLoaded && !vmiLoadError && getVMINodeName(vmi);
  const ipAddresses = vmiLoaded && !vmiLoadError && getVmiIpAddresses(vmi);

  return (
    <>
      <TableData
        className={vmColumnInfo.name.classes}
        id={vmColumnInfo.name.id}
        activeColumnIDs={activeColumnIDs}
      >
        <ResourceLink groupVersionKind={groupVersionKind} name={name} namespace={namespace} />
      </TableData>
      <TableData
        className={classNames(vmColumnInfo.namespace.classes, 'co-break-word')}
        activeColumnIDs={activeColumnIDs}
        id={vmColumnInfo.namespace.id}
      >
        <ResourceLink kind="Namespace" name={namespace} />
      </TableData>
      <TableData
        className={vmColumnInfo.status.classes}
        activeColumnIDs={activeColumnIDs}
        id={vmColumnInfo.status.id}
      >
        <VirtualMachinesPageStatus
          vm={(vmLoaded && !vmLoadError && vmResource) || vm}
          vmi={vmi}
          vmiLoaded={vmiLoaded}
          vmiLoadError={vmiLoadError}
        />
      </TableData>
      <TableData
        className={vmColumnInfo.conditions.classes}
        activeColumnIDs={activeColumnIDs}
        id={vmColumnInfo.conditions.id}
      >
        <VirtualMachinesPageConditions kind={groupVersionKind.kind.toLowerCase()} obj={vm} />
      </TableData>
      <TableData
        className={vmColumnInfo.created.classes}
        activeColumnIDs={activeColumnIDs}
        id={vmColumnInfo.created.id}
      >
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData
        className={vmColumnInfo.node.classes}
        activeColumnIDs={activeColumnIDs}
        id={vmColumnInfo.node.id}
      >
        {node && <ResourceLink kind="Node" name={node} namespace={namespace} />}
      </TableData>
      <TableData
        className={vmColumnInfo.ipaddress.classes}
        activeColumnIDs={activeColumnIDs}
        id={vmColumnInfo.ipaddress.id}
      >
        {vmiLoaded && !vmiLoadError && <VMIP data={ipAddresses} />}
      </TableData>
      <TableData className={Kebab.columnClass} activeColumnIDs={activeColumnIDs} id="">
        <LazyActionMenu context={context} isDisabled={phase === 'Terminating'} />
      </TableData>
    </>
  );
};
VMTableRow.displayName = 'VMTableRow';

const VMList: React.FC<VMListProps> = ({ showNamespaceOverride, ...props }) => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => getColumns(t), [t]);
  const [activeColumns] = useActiveColumns({
    columns,
    showNamespaceOverride,
    columnManagementID,
  });
  return (
    <VirtualizedTable<VMKind | VMIKind>
      {...props}
      aria-label={t('kubevirt-plugin~VirtualMachines')}
      columns={activeColumns}
      Row={VMTableRow}
    />
  );
};
VMList.displayName = 'VMList';

const getFilters = (t: TFunction): RowFilter<VMKind | VMIKind>[] => [
  {
    filterGroupName: t('kubevirt-plugin~Status'),
    type: 'vm-status',
    reducer: (obj) => vmPhaseGroups(vmPhase(obj as VMKind | VMIKind)),
    items: VM_STATUS_SIMPLE_LABELS.map((status) => ({
      id: status,
      title: status,
    })),
    filter: (statuses, obj) => {
      const status = vmPhaseGroups(vmPhase(obj as VMKind | VMIKind));
      return statuses.selected?.length === 0 || statuses.selected?.includes(status);
    },
  },
];

const VirtualMachinesPage: React.FC<VirtualMachinesPageProps> = ({
  canCreate = true,
  namespace,
  showNodes,
  showTitle = true,
  selector,
  fieldSelector,
  nameFilter,
  showNamespaceOverride,
}) => {
  const { t } = useTranslation();

  const [vms, vmsLoaded, vmsLoadError] = useK8sWatchResource<VMKind[]>({
    groupVersionKind: {
      version: 'v1',
      kind: 'VirtualMachine',
      group: 'kubevirt.io',
    },
    isList: true,
    namespaced: true,
    namespace,
    selector,
    fieldSelector,
  });

  const [vmis, vmisLoaded, vmisLoadError] = useK8sWatchResource<VMIKind[]>({
    groupVersionKind: {
      version: 'v1',
      kind: 'VirtualMachineInstance',
      group: 'kubevirt.io',
    },
    isList: true,
    namespaced: true,
    namespace,
    selector,
    fieldSelector,
  });

  const loaded = vmsLoaded && vmisLoaded;
  const loadError = vmsLoadError || vmisLoadError;

  const tableData =
    (loaded &&
      !loadError && [
        ...vms,
        ...vmis.filter(
          (vmi) =>
            !getOwnerReferences(vmi)?.find((owner) => owner.kind === VirtualMachineModel.kind),
        ),
      ]) ||
    [];

  const filters = React.useMemo(() => getFilters(t), [t]);
  const [data, filteredData, onFilterChange] = useListPageFilter(tableData, filters, {
    name: { selected: [nameFilter] },
  });

  return (
    <>
      <ListPageHeader title={showTitle ? t('kubevirt-plugin~VirtualMachines') : undefined}>
        {canCreate && <VirtualMachinesPageActions namespace={namespace} />}
      </ListPageHeader>
      {!data.length ? (
        <VirtualMachinesEmptyPage canCreate={canCreate} namespace={namespace} />
      ) : (
        <ListPageBody>
          <ListPageFilter
            data={data}
            loaded={vmsLoaded}
            rowFilters={filters}
            onFilterChange={onFilterChange}
          />
          <VMList
            data={filteredData}
            unfilteredData={tableData}
            loaded={loaded}
            loadError={loadError}
            showNamespaceOverride={showNamespaceOverride}
            showNodes={showNodes}
          />
        </ListPageBody>
      )}
    </>
  );
};

type VMListProps = {
  data: (VMKind | VMIKind)[];
  unfilteredData: (VMKind | VMIKind)[];
  loaded: boolean;
  loadError: any;
  showNodes?: boolean;
  showNamespaceOverride?: boolean;
};

type VirtualMachinesPageProps = {
  canCreate?: boolean;
  fieldSelector?: string;
  namespace?: string;
  selector?: Selector;
  showTitle?: boolean;
  showNodes?: boolean;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
  hideColumnManagement?: boolean;
  nameFilter?: string;
  showNamespaceOverride?: boolean;
};

export { VirtualMachinesPage };
