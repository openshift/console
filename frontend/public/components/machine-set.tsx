import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom-v5-compat';
import { sortable } from '@patternfly/react-table';
import { css } from '@patternfly/react-styles';
import { getMachineAWSPlacement, getMachineRole, getMachineSetInstanceType } from '@console/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ListPageBody, RowProps, TableColumn } from '@console/dynamic-plugin-sdk';
import {
  Tooltip,
  Button,
  Card,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { useTranslation } from 'react-i18next';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';

import { useActiveColumns } from '@console/dynamic-plugin-sdk/src/lib-core';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import PaneBodyGroup from '@console/shared/src/components/layout/PaneBodyGroup';
import { MachineModel, MachineSetModel, NodeModel } from '../models';
import {
  K8sKind,
  K8sResourceKind,
  MachineDeploymentKind,
  MachineSetKind,
  MachineKind,
  NodeKind,
  referenceForModel,
  Selector as SelectorType,
  LabelSelector,
} from '../module/k8s';
import { MachinePage } from './machine';
import {
  useConfigureCountModal,
  ConfigureCountModalProps,
} from '@console/internal/components/modals/configure-count-modal';
import { DetailsPage, TableData } from './factory';
import VirtualizedTable from './factory/Table/VirtualizedTable';
import { sortResourceByValue } from './factory/Table/sort';
import ListPageFilter from './factory/ListPage/ListPageFilter';
import ListPageHeader from './factory/ListPage/ListPageHeader';
import { useListPageFilter } from './factory/ListPage/filter-hook';
import ListPageCreate from './factory/ListPage/ListPageCreate';
import {
  Kebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  navFactory,
  resourcePath,
  useAccessReview,
  convertToBaseValue,
  formatBytesAsGiB,
} from './utils';
import { ResourceEventStream } from './events';

const MachinesResource = {
  isList: true,
  kind: referenceForModel(MachineModel),
};

const NodesResource = {
  isList: true,
  kind: NodeModel.kind,
  namespaced: false,
};

const useMachineCountModal = ({ resource }: ConfigureCountModalProps) => {
  const launchModal = useConfigureCountModal({
    resourceKind: MachineSetModel,
    resource,
    titleKey: 'public~Edit Machine count',
    messageKey: 'public~{{resourceKind}} maintain the proper number of healthy machines.',
    messageVariables: { resourceKind: MachineSetModel.labelPlural },
    path: '/spec/replicas',
    buttonTextKey: 'public~Save',
  });

  return useCallback(() => {
    launchModal();
  }, [launchModal]);
};

const machineReference = referenceForModel(MachineModel);
const machineSetReference = referenceForModel(MachineSetModel);

// `spec.replicas` defaults to 1 if not specified. Make sure to differentiate between undefined and 0.
export const getDesiredReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.spec?.replicas ?? 1;
const getReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.status?.replicas || 0;
export const getReadyReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.status?.readyReplicas || 0;
export const getAvailableReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.status?.availableReplicas || 0;

const tableColumnInfo = [
  { className: '', id: 'name' },
  { className: '', id: 'namespace' },
  { className: css('pf-m-hidden', 'pf-m-visible-on-md'), id: 'machines' },
  { className: css('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'instanceType' },
  { className: css('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'cpu' },
  { className: css('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'memory' },
  { className: Kebab.columnClass, id: '' },
];

export const MachineCounts: React.FC<MachineCountsProps> = ({ resourceKind, resource }) => {
  const editReplicas = useMachineCountModal({ resource });
  const desiredReplicas = getDesiredReplicas(resource);
  const replicas = getReplicas(resource);
  const readyReplicas = getReadyReplicas(resource);
  const availableReplicas = getAvailableReplicas(resource);

  const canUpdate = useAccessReview({
    group: resourceKind.apiGroup,
    resource: resourceKind.plural,
    verb: 'patch',
    name: resource.metadata.name,
    namespace: resource.metadata.namespace,
  });
  const { t } = useTranslation();
  const desiredReplicasText = `${desiredReplicas}  ${t('public~machine', {
    count: desiredReplicas,
  })}`;

  return (
    <PaneBodyGroup>
      <DescriptionList className="co-detail-table">
        <Card>
          <DescriptionListTerm>{t('public~Desired count')}</DescriptionListTerm>
          <DescriptionListDescription>
            {canUpdate ? (
              <Button
                icon={<PencilAltIcon />}
                iconPosition="end"
                variant="link"
                type="button"
                isInline
                onClick={() => editReplicas()}
              >
                {desiredReplicasText}
              </Button>
            ) : (
              desiredReplicasText
            )}
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Current count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip content={t('public~The most recently observed number of replicas.')}>
              <span>{t('public~{{replicas}} machine', { replicas, count: replicas })}</span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Ready count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip
              content={t(
                'public~The number of ready replicas for this MachineSet. A machine is considered ready when the node has been created and is ready.',
              )}
            >
              <span>
                {t('public~{{readyReplicas}} machine', {
                  readyReplicas,
                  count: readyReplicas,
                })}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Available count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip
              content={t(
                'public~The number of available replicas (ready for at least minReadySeconds) for this MachineSet.',
              )}
            >
              <span>
                {t('public~{{availableReplicas}} machine', {
                  availableReplicas,
                  count: availableReplicas,
                })}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
      </DescriptionList>
    </PaneBodyGroup>
  );
};

export const MachineTabPage: React.FC<MachineTabPageProps> = ({ obj }) => (
  <MachinePage namespace={obj.metadata.namespace} showTitle={false} selector={obj.spec.selector} />
);

const MachineSetDetails: React.FC<MachineSetDetailsProps> = ({ obj }) => {
  const machineRole = getMachineRole(obj);
  const { availabilityZone, region } = getMachineAWSPlacement(obj);
  const instanceType = getMachineSetInstanceType(obj);
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('public~MachineSet details')} />
      <MachineCounts resourceKind={MachineSetModel} resource={obj} />
      <Grid hasGutter>
        <GridItem md={6}>
          <ResourceSummary resource={obj}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Selector')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Selector
                  kind={machineReference}
                  selector={obj.spec?.selector}
                  namespace={obj.metadata.namespace}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Instance type')}</DescriptionListTerm>
              <DescriptionListDescription>{instanceType || '-'}</DescriptionListDescription>
            </DescriptionListGroup>
            {machineRole && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Machine role')}</DescriptionListTerm>
                <DescriptionListDescription>{machineRole}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {region && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Region')}</DescriptionListTerm>
                <DescriptionListDescription>{region}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {availabilityZone && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Availability zone')}</DescriptionListTerm>
                <DescriptionListDescription>{availabilityZone}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </ResourceSummary>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export const MachineSetList: React.FC<MachineSetListProps> = (props) => {
  const { t } = useTranslation();

  const [machines] = useK8sWatchResource<MachineKind[]>(MachinesResource);
  const [nodes] = useK8sWatchResource<NodeKind[]>(NodesResource);

  // TODO (jon) - use React context to share capacityResolver across table columns and rows
  const capacityResolver = useCallback(
    (obj: MachineSetKind) => {
      const machine = (machines ?? [])?.find((m) => {
        return new LabelSelector(obj.spec.selector).matches(m);
      });
      const node = (nodes ?? []).find(
        (n) => machine && machine.status?.nodeRef?.uid === n.metadata.uid,
      );
      const { cpu, memory } = node?.status?.capacity ?? {};
      return {
        cpu: convertToBaseValue(cpu) ?? 0,
        memory: formatBytesAsGiB(convertToBaseValue(memory) ?? 0),
      };
    },
    [machines, nodes],
  );

  // TODO (jon) - this should be a hook
  const machineSetTableColumn = useMemo<TableColumn<MachineSetKind>[]>(
    () => [
      {
        title: t('public~Name'),
        sort: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnInfo[0].className },
        id: tableColumnInfo[0].id,
      },
      {
        title: t('public~Namespace'),
        sort: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnInfo[1].className },
        id: tableColumnInfo[1].id,
      },
      {
        title: t('public~Machines'),
        sort: 'status.readyReplicas',
        transforms: [sortable],
        props: { className: tableColumnInfo[2].className },
        id: tableColumnInfo[2].id,
      },
      {
        title: t('public~Instance type'),
        sort: (data, direction) =>
          data.sort(sortResourceByValue(direction, getMachineSetInstanceType)),
        transforms: [sortable],
        props: { className: tableColumnInfo[3].className },
        id: tableColumnInfo[3].id,
      },
      {
        title: t('public~CPU'),
        sort: (data, direction) =>
          data.sort(sortResourceByValue(direction, (obj) => capacityResolver(obj).cpu)),
        transforms: [sortable],
        props: { className: tableColumnInfo[4].className },
        id: tableColumnInfo[4].id,
      },
      {
        title: t('public~Memory'),
        sort: (data, direction) =>
          data.sort(sortResourceByValue(direction, (obj) => capacityResolver(obj).memory)),
        transforms: [sortable],
        props: { className: tableColumnInfo[5].className },
        id: tableColumnInfo[5].id,
      },
      {
        title: '',
        props: { className: tableColumnInfo[6].className },
        id: tableColumnInfo[6].id,
      },
    ],
    [capacityResolver, t],
  );

  // TODO (jon): Anti-pattern. This should be declared outside the MachineSetList component
  const MachineSetTableRow: React.FC<RowProps<MachineSetKind>> = ({ obj }) => {
    const { cpu, memory } = capacityResolver(obj);
    const readyReplicas = getReadyReplicas(obj);
    const desiredReplicas = getDesiredReplicas(obj);
    const instanceType = getMachineSetInstanceType(obj);
    return (
      <>
        <TableData {...tableColumnInfo[0]}>
          <ResourceLink
            kind={machineSetReference}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        </TableData>
        <TableData
          {...tableColumnInfo[1]}
          className={css(tableColumnInfo[1].className, 'co-break-word')}
          columnID="namespace"
        >
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        </TableData>
        <TableData {...tableColumnInfo[2]}>
          <Link
            to={`${resourcePath(
              machineSetReference,
              obj.metadata.name,
              obj.metadata.namespace,
            )}/machines`}
          >
            {t('public~{{readyReplicas}} of {{count}} machine', {
              readyReplicas,
              count: desiredReplicas,
            })}
          </Link>
        </TableData>
        <TableData {...tableColumnInfo[3]}>{instanceType || '-'}</TableData>
        <TableData {...tableColumnInfo[4]}>{t('public~{{count}} core', { count: cpu })}</TableData>
        <TableData {...tableColumnInfo[5]}>{t('public~{{memory}} GiB', { memory })}</TableData>
        <TableData {...tableColumnInfo[6]}>
          <LazyActionMenu context={{ [machineSetReference]: obj }} />
        </TableData>
      </>
    );
  };

  const [columns] = useActiveColumns({
    columns: machineSetTableColumn,
    showNamespaceOverride: false,
    columnManagementID: machineSetReference,
  });

  return (
    <VirtualizedTable<MachineSetKind>
      {...props}
      aria-label={t('public~MachineSets')}
      label={t('public~MachineSets')}
      columns={columns}
      Row={MachineSetTableRow}
    />
  );
};

export const MachineSetPage: React.FC<MachineSetPageProps> = ({
  namespace,
  selector,
  showTitle = true,
  hideLabelFilter,
  hideNameLabelFilters,
  hideColumnManagement,
}) => {
  const [machineSets, loaded, loadError] = useK8sWatchResource<MachineSetKind[]>({
    isList: true,
    kind: referenceForModel(MachineSetModel),
    selector,
    namespace,
  });
  const createAccessReview = {
    groupVersionKind: referenceForModel(MachineSetModel),
    namespace: namespace || 'default',
  };

  const [data, filteredData, onFilterChange] = useListPageFilter(machineSets);

  const { t } = useTranslation();
  return (
    <>
      <ListPageHeader title={showTitle ? t('public~MachineSets') : undefined}>
        <ListPageCreate
          createAccessReview={createAccessReview}
          groupVersionKind={referenceForModel(MachineSetModel)}
        >
          {t('public~Create MachineSet')}
        </ListPageCreate>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter
          data={data}
          loaded={loaded}
          onFilterChange={onFilterChange}
          hideNameLabelFilters={hideNameLabelFilters}
          hideLabelFilter={hideLabelFilter}
          hideColumnManagement={hideColumnManagement}
        />
        <MachineSetList
          data={filteredData}
          unfilteredData={machineSets}
          loaded={loaded}
          loadError={loadError}
        />
      </ListPageBody>
    </>
  );
};

export const MachineSetDetailsPage: React.FC = (props) => (
  <DetailsPage
    {...props}
    kind={machineSetReference}
    customActionMenu={(obj: K8sResourceKind) => (
      <LazyActionMenu context={{ [machineSetReference]: obj }} />
    )}
    pages={[
      navFactory.details(MachineSetDetails),
      navFactory.editYaml(),
      navFactory.machines(MachineTabPage),
      navFactory.events(ResourceEventStream),
    ]}
  />
);

type MachineSetListProps = {
  data: MachineSetKind[];
  unfilteredData: MachineSetKind[];
  loaded: boolean;
  loadError: any;
};

export type MachineCountsProps = {
  resourceKind: K8sKind;
  resource: MachineSetKind | MachineDeploymentKind;
};

export type MachineTabPageProps = {
  obj: MachineSetKind;
};

export type MachineSetDetailsProps = {
  obj: MachineSetKind;
};

export type MachineSetPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: SelectorType;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
  hideColumnManagement?: boolean;
};
