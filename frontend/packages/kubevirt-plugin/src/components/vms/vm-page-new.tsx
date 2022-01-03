import * as React from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  Title,
} from '@patternfly/react-core';
import { RocketIcon, VirtualMachineIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { Link } from 'react-router-dom';
import { QuickStartModel } from '@console/app/src/models';
import {
  K8sResourceCommon,
  RowProps,
  TableColumn,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { useListPageFilter } from '@console/internal/components/factory/ListPage/filter-hook';
import ListPageBody from '@console/internal/components/factory/ListPage/ListPageBody';
import ListPageFilter from '@console/internal/components/factory/ListPage/ListPageFilter';
import VirtualizedTable, {
  TableData,
} from '@console/internal/components/factory/Table/VirtualizedTable';
import {
  CamelCaseWrap,
  history,
  Kebab,
  ResourceLink,
  Timestamp,
  useAccessReview2,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NodeModel } from '@console/internal/models';
import { apiGroupForReference, versionForReference } from '@console/internal/module/k8s/k8s';
import { createBasicLookup, EntityMap, LazyActionMenu } from '@console/shared';
import GenericStatus from '@console/shared/src/components/status/GenericStatus';
import { VMWizardMode, VMWizardName } from '../../constants';
import { getVmStatusFromPrintable, VMStatus } from '../../constants/vm/vm-status';
import { useNamespace } from '../../hooks/use-namespace';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getStatusPhase } from '../../selectors';
import { getVmiIpAddresses, getVMINodeName } from '../../selectors/vmi';
import { VMIKind, VMKind } from '../../types';
import { VMILikeEntityKind } from '../../types/vmLike';
import { DASH, getBasicID, getVMActionContext } from '../../utils';
import { hasPendingChanges } from '../../utils/pending-changes';
import { getVMWizardCreateLink } from '../../utils/url';
import { getVMStatusIcon } from '../vm-status/vm-status';
import { vmTableFilters } from './table-filters';
import VMIP from './VMIP';

import './vm.scss';

const tableColumnInfo = [
  { className: '', id: 'name' },
  { className: '', id: 'namespace' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-md'), id: 'status' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'created' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'node' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'ip' },
  { className: Kebab.columnClass, id: '' },
];

const columns: (t: TFunction) => TableColumn<K8sResourceCommon>[] = (t) => [
  {
    title: t('kubevirt-plugin~Name'),
    sort: 'metadata.name',
    id: tableColumnInfo[0].id,
    transforms: [sortable],
    props: { className: tableColumnInfo[0].className },
  },
  {
    title: t('kubevirt-plugin~Namespace'),
    sort: 'metadata.namespace',
    id: tableColumnInfo[1].id,
    transforms: [sortable],
    props: { className: tableColumnInfo[1].className },
  },
  {
    title: t('kubevirt-plugin~Status'),
    sort: 'status.printableStatus',
    id: tableColumnInfo[2].id,
    transforms: [sortable],
    props: { className: tableColumnInfo[2].className },
  },
  {
    title: t('kubevirt-plugin~Created'),
    sort: 'metadata.creationTimestamp',
    id: tableColumnInfo[3].id,
    transforms: [sortable],
    props: { className: tableColumnInfo[3].className },
  },
  {
    title: t('kubevirt-plugin~Node'),
    id: tableColumnInfo[4].id,
    props: { className: tableColumnInfo[4].className },
  },
  {
    title: t('kubevirt-plugin~IP Address'),
    id: tableColumnInfo[5].id,
    props: { className: tableColumnInfo[5].className },
  },
  {
    title: '',
    props: { className: tableColumnInfo[6].className },
    id: tableColumnInfo[6].id,
  },
];

const VMRow: React.FC<RowProps<
  VMILikeEntityKind,
  { kind: string; vmisLookup: EntityMap<VMIKind> }
>> = ({ obj, activeColumnIDs, rowData: { vmisLookup, kind } }) => {
  const vmContext = getVMActionContext(obj);
  const lookupID = getBasicID(obj);

  const vmi = React.useMemo(() => {
    return obj.kind === VirtualMachineModel.kind ? vmisLookup[lookupID] : (obj as VMIKind);
  }, [lookupID, obj, vmisLookup]);

  const { node, ipAddresses } = React.useMemo(() => {
    return {
      node: getVMINodeName(vmi),
      ipAddresses: getVmiIpAddresses(vmi),
    };
  }, [vmi]);

  const arePendingChanges = React.useMemo(() => {
    return obj.kind === VirtualMachineModel.kind ? hasPendingChanges(obj as VMKind, vmi) : false;
  }, [obj, vmi]);

  const vmsStatus: VMStatus = getVmStatusFromPrintable(obj?.status?.printableStatus);
  return (
    <>
      <TableData {...tableColumnInfo[0]} activeColumnIDs={activeColumnIDs}>
        <ResourceLink
          groupVersionKind={{
            kind: obj?.kind,
            version: versionForReference(kind),
            group: apiGroupForReference(kind),
          }}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData {...tableColumnInfo[1]} activeColumnIDs={activeColumnIDs}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData {...tableColumnInfo[2]} activeColumnIDs={activeColumnIDs}>
        {obj.kind === VirtualMachineModel.kind ? (
          <GenericStatus
            title={obj?.status?.printableStatus || getStatusPhase(obj)}
            Icon={getVMStatusIcon(vmsStatus, arePendingChanges)}
          />
        ) : (
          <CamelCaseWrap value={getStatusPhase(obj)} dataTest="status-text" />
        )}
      </TableData>
      <TableData {...tableColumnInfo[3]} activeColumnIDs={activeColumnIDs}>
        <Timestamp timestamp={obj?.metadata?.creationTimestamp} />
      </TableData>
      <TableData {...tableColumnInfo[4]} activeColumnIDs={activeColumnIDs}>
        {node ? (
          <ResourceLink
            key="node-link"
            kind={NodeModel.kind}
            name={node}
            namespace={obj?.metadata?.namespace}
          />
        ) : (
          DASH
        )}
      </TableData>
      <TableData {...tableColumnInfo[5]} activeColumnIDs={activeColumnIDs}>
        {ipAddresses?.length > 0 ? <VMIP data={ipAddresses} /> : DASH}
      </TableData>
      <TableData {...tableColumnInfo[6]} activeColumnIDs={activeColumnIDs}>
        <LazyActionMenu context={vmContext} />
      </TableData>
    </>
  );
};

const VMListEmpty: React.FC = () => {
  const { t } = useTranslation();
  const namespace = useNamespace();

  const [canCreate] = useAccessReview2({
    group: VirtualMachineModel?.apiGroup,
    resource: VirtualMachineModel?.plural,
    verb: 'create',
    namespace,
  });

  const searchText = 'virtual machine';
  const [quickStarts, quickStartsLoaded] = useK8sWatchResource<QuickStart[]>({
    kind: kubevirtReferenceForModel(QuickStartModel),
    isList: true,
  });
  const hasQuickStarts =
    quickStartsLoaded &&
    quickStarts.find(
      ({ spec: { displayName, description } }) =>
        displayName.toLowerCase().includes(searchText) ||
        description.toLowerCase().includes(searchText),
    );

  return (
    <EmptyState>
      <EmptyStateIcon icon={VirtualMachineIcon} />
      <Title headingLevel="h4" size="lg">
        {t('kubevirt-plugin~No virtual machines found')}
      </Title>
      <EmptyStateBody>
        <Trans ns="kubevirt-plugin">
          See the{' '}
          <Link data-test="vm-empty-templates" to={`/k8s/ns/${namespace}/virtualmachinetemplates`}>
            templates tab
          </Link>{' '}
          to quickly create a virtual machine from the available templates.
        </Trans>
      </EmptyStateBody>
      <Button
        data-test="create-vm-empty"
        variant="primary"
        isDisabled={!canCreate}
        onClick={() =>
          history.push(
            getVMWizardCreateLink({
              namespace,
              wizardName: VMWizardName.BASIC,
              mode: VMWizardMode.VM,
            }),
          )
        }
      >
        {t('kubevirt-plugin~Create virtual machine')}
      </Button>
      {hasQuickStarts && (
        <EmptyStateSecondaryActions>
          <Button
            data-test="vm-quickstart"
            variant="secondary"
            onClick={() => history.push('/quickstart?keyword=virtual+machine')}
          >
            <RocketIcon className="kv-vm-quickstart-icon" />
            {t('kubevirt-plugin~Learn how to use virtual machines')}
          </Button>
        </EmptyStateSecondaryActions>
      )}
    </EmptyState>
  );
};

const VMTable: React.FC<{
  vmisLookup: EntityMap<VMIKind>;
  kind: string;
  data: K8sResourceCommon[];
  unfilteredData: K8sResourceCommon[];
  loaded: boolean;
  loadError: any;
}> = ({ data, unfilteredData, loaded, loadError, vmisLookup, kind }) => {
  const { t } = useTranslation();

  return (
    <VirtualizedTable<K8sResourceCommon, { kind: string; vmisLookup: EntityMap<VMIKind> }>
      data={data}
      unfilteredData={unfilteredData}
      loaded={loaded}
      loadError={loadError}
      columns={columns(t)}
      Row={VMRow}
      EmptyMsg={VMListEmpty}
      rowData={{ vmisLookup, kind }}
    />
  );
};

export const VirtualMachinesPage: React.FC<{
  obj: { kind: string };
  match: match<{ ns?: string }>;
}> = (props) => {
  const [vms, loaded, loadError] = useK8sWatchResource<VMKind[]>({
    kind: props?.obj?.kind,
    isList: true,
    namespaced: true,
    namespace: props?.match?.params?.ns,
  });
  const [vmis, vmisLoaded, vmisLoadError] = useK8sWatchResource<VMIKind[]>({
    kind: kubevirtReferenceForModel(VirtualMachineInstanceModel),
    isList: true,
    namespaced: true,
    namespace: props?.match?.params?.ns,
  });

  const vmLikeUnion = React.useMemo(() => {
    return _.unionBy<VMILikeEntityKind>(vms, vmis, getBasicID);
  }, [vmis, vms]);

  const vmisLookup = React.useMemo(() => {
    return createBasicLookup<VMIKind>(vmis, getBasicID);
  }, [vmis]);

  const [data, filteredData, onFilterChange] = useListPageFilter(vmLikeUnion, vmTableFilters);

  return (
    <ListPageBody>
      <ListPageFilter
        data={data}
        loaded={loaded && vmisLoaded}
        rowFilters={vmTableFilters}
        onFilterChange={onFilterChange}
      />
      <VMTable
        data={filteredData}
        unfilteredData={data}
        loaded={loaded && vmisLoaded}
        loadError={loadError || vmisLoadError}
        vmisLookup={vmisLookup}
        kind={props?.obj?.kind}
      />
    </ListPageBody>
  );
};
