import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { getMachineAWSPlacement, getMachineRole, getMachineSetInstanceType } from '@console/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { RowProps, TableColumn } from '@console/dynamic-plugin-sdk';
import { Tooltip, Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import { MachineAutoscalerModel, MachineModel, MachineSetModel, NodeModel } from '../models';
import {
  K8sKind,
  MachineDeploymentKind,
  MachineSetKind,
  MachineKind,
  NodeKind,
  referenceForModel,
  Selector as SelectorType,
} from '../module/k8s';
import { MachinePage } from './machine';
import { configureMachineAutoscalerModal, configureReplicaCountModal } from './modals';
import { DetailsPage, TableData } from './factory';
import VirtualizedTable from './factory/Table/VirtualizedTable';
import { sortResourceByValue } from './factory/Table/sort';
import ListPageFilter from './factory/ListPage/ListPageFilter';
import ListPageHeader from './factory/ListPage/ListPageHeader';
import ListPageBody from './factory/ListPage/ListPageBody';
import { useListPageFilter } from './factory/ListPage/filter-hook';
import ListPageCreate from './factory/ListPage/ListPageCreate';
import {
  Kebab,
  KebabAction,
  ResourceKebab,
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

const machineReplicasModal = (
  resourceKind: K8sKind,
  resource: MachineSetKind | MachineDeploymentKind,
) =>
  configureReplicaCountModal({
    resourceKind,
    resource,
    // t('public~Edit Machine count')
    titleKey: 'public~Edit Machine count',
    // t('public~{{resourceKind}} maintain the proper number of healthy machines.')
    messageKey: 'public~{{resourceKind}} maintain the proper number of healthy machines.',
    messageVariables: { resourceKind: resourceKind.labelPlural },
  });

export const editCountAction: KebabAction = (
  kind: K8sKind,
  resource: MachineSetKind | MachineDeploymentKind,
) => ({
  // t('public~Edit Machine count')
  labelKey: 'public~Edit Machine count',
  callback: () => machineReplicasModal(kind, resource),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: resource.metadata.name,
    namespace: resource.metadata.namespace,
    verb: 'patch',
  },
});

const configureMachineAutoscaler: KebabAction = (kind: K8sKind, machineSet: MachineSetKind) => ({
  // t('public~Create MachineAutoscaler')
  labelKey: 'public~Create MachineAutoscaler',
  callback: () => configureMachineAutoscalerModal({ machineSet, cancel: _.noop, close: _.noop }),
  accessReview: {
    group: MachineAutoscalerModel.apiGroup,
    resource: MachineAutoscalerModel.plural,
    namespace: machineSet.metadata.namespace,
    verb: 'create',
  },
});

const { common } = Kebab.factory;
const menuActions = [
  editCountAction,
  configureMachineAutoscaler,
  ...Kebab.getExtensionsActionsForKind(MachineSetModel),
  ...common,
];
const machineReference = referenceForModel(MachineModel);
const machineSetReference = referenceForModel(MachineSetModel);

// `spec.replicas` defaults to 1 if not specified. Make sure to differentiate between undefined and 0.
export const getDesiredReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) => {
  return machineSet?.spec?.replicas ?? 1;
};

const getReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.status?.replicas || 0;
export const getReadyReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.status?.readyReplicas || 0;
export const getAvailableReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.status?.availableReplicas || 0;

const tableColumnInfo = [
  { className: '', id: 'name' },
  { className: '', id: 'namespace' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-md'), id: 'machines' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'instanceType' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'cpu' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'memory' },
  { className: Kebab.columnClass, id: '' },
];

export const MachineCounts: React.FC<MachineCountsProps> = ({
  resourceKind,
  resource,
}: {
  resourceKind: K8sKind;
  resource: MachineSetKind | MachineDeploymentKind;
}) => {
  const editReplicas = (event) => {
    event.preventDefault();
    machineReplicasModal(resourceKind, resource);
  };

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
    <div className="co-m-pane__body-group">
      <div className="co-detail-table">
        <div className="co-detail-table__row row">
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">{t('public~Desired count')}</dt>
              <dd>
                {canUpdate ? (
                  <Button variant="link" type="button" isInline onClick={editReplicas}>
                    {desiredReplicasText}
                    <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
                  </Button>
                ) : (
                  desiredReplicasText
                )}
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">{t('public~Current count')}</dt>
              <dd>
                <Tooltip content={t('public~The most recently observed number of replicas.')}>
                  <span>{t('public~{{replicas}} machine', { replicas, count: replicas })}</span>
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">{t('public~Ready count')}</dt>
              <dd>
                <Tooltip
                  content={t(
                    'public~The number of ready replicas for this MachineSet. A machine is considered ready when the node has been created and is ready.',
                  )}
                >
                  <span>
                    {t('public~{{readyReplicas}} machine', { readyReplicas, count: readyReplicas })}
                  </span>
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section co-detail-table__section--last">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">{t('public~Available count')}</dt>
              <dd>
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
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MachineTabPage: React.SFC<MachineTabPageProps> = ({
  obj,
}: {
  obj: MachineSetKind;
}) => (
  <MachinePage namespace={obj.metadata.namespace} showTitle={false} selector={obj.spec.selector} />
);

const MachineSetDetails: React.SFC<MachineSetDetailsProps> = ({ obj }) => {
  const machineRole = getMachineRole(obj);
  const { availabilityZone, region } = getMachineAWSPlacement(obj);
  const instanceType = getMachineSetInstanceType(obj);
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~MachineSet details')} />
        <MachineCounts resourceKind={MachineSetModel} resource={obj} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={obj}>
              <dt>{t('public~Selector')}</dt>
              <dd>
                <Selector
                  kind={machineReference}
                  selector={obj.spec?.selector}
                  namespace={obj.metadata.namespace}
                />
              </dd>
              <dt>{t('public~Instance type')}</dt>
              <dd>{instanceType || '-'}</dd>
              {machineRole && (
                <>
                  <dt>{t('public~Machine role')}</dt>
                  <dd>{machineRole}</dd>
                </>
              )}
              {region && (
                <>
                  <dt>{t('public~Region')}</dt>
                  <dd>{region}</dd>
                </>
              )}
              {availabilityZone && (
                <>
                  <dt>{t('public~Availability zone')}</dt>
                  <dd>{availabilityZone}</dd>
                </>
              )}
            </ResourceSummary>
          </div>
        </div>
      </div>
    </>
  );
};

type MachineSetListProps = {
  data: MachineSetKind[];
  unfilteredData: MachineSetKind[];
  loaded: boolean;
  loadError: any;
};

export const MachineSetList: React.FC<MachineSetListProps> = (props) => {
  const { t } = useTranslation();
  const [machines, machinesLoaded] = useK8sWatchResource<MachineKind[]>(MachinesResource);
  const [nodes, nodesLoaded] = useK8sWatchResource<NodeKind[]>(NodesResource);

  const getRelatedNodes = React.useCallback(
    (obj: MachineSetKind): NodeKind[] => {
      const relatedMachines = machinesLoaded
        ? machines?.filter(
            (machine) =>
              machine.metadata.labels?.['machine.openshift.io/cluster-api-machineset'] ===
              obj.metadata.name,
          )
        : [];
      return nodesLoaded && relatedMachines.length > 0
        ? nodes.filter((node) =>
            relatedMachines.some((machine) => node.metadata.uid === machine.status?.nodeRef?.uid),
          )
        : [];
    },
    [machines, machinesLoaded, nodes, nodesLoaded],
  );
  const numCores = React.useCallback(
    (obj: MachineSetKind): number => {
      const relatedNodes = getRelatedNodes(obj);
      return nodesLoaded && relatedNodes.length > 0
        ? convertToBaseValue(relatedNodes[0].status?.capacity.cpu) ?? 0
        : 0;
    },
    [getRelatedNodes, nodesLoaded],
  );

  const memory = React.useCallback(
    (obj: MachineSetKind): string | number => {
      const relatedNodes = getRelatedNodes(obj);
      return nodesLoaded && relatedNodes.length > 0
        ? formatBytesAsGiB(convertToBaseValue(relatedNodes[0].status?.capacity.memory) ?? 0)
        : 0;
    },
    [getRelatedNodes, nodesLoaded],
  );

  const machineSetTableColumn = React.useMemo<TableColumn<MachineSetKind>[]>(
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
        sort: (data, direction) => data.sort(sortResourceByValue(direction, numCores)),
        transforms: [sortable],
        props: { className: tableColumnInfo[4].className },
        id: tableColumnInfo[4].id,
      },
      {
        title: t('public~Memory'),
        sort: (data, direction) => data.sort(sortResourceByValue(direction, memory)),
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
    [memory, numCores, t],
  );

  const MachineSetTableRow: React.FC<RowProps<MachineSetKind>> = ({ obj }) => {
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
          className={classNames(tableColumnInfo[1].className, 'co-break-word')}
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
            {t('public~{{numReadyReplicas}} of {{numDesiredReplicas}} machine', {
              numReadyReplicas: getReadyReplicas(obj),
              numDesiredReplicas: getDesiredReplicas(obj),
              count: getDesiredReplicas(obj),
            })}
          </Link>
        </TableData>
        <TableData {...tableColumnInfo[3]}>{getMachineSetInstanceType(obj) || '-'}</TableData>
        <TableData {...tableColumnInfo[4]}>
          {t('public~{{count}} core', {
            count: numCores(obj),
          })}
        </TableData>
        <TableData {...tableColumnInfo[5]}>
          {t('public~{{memory}} GiB', {
            memory: memory(obj),
          })}
        </TableData>
        <TableData {...tableColumnInfo[6]}>
          <ResourceKebab actions={menuActions} kind={machineSetReference} resource={obj} />
        </TableData>
      </>
    );
  };
  return (
    <VirtualizedTable<MachineSetKind>
      {...props}
      loaded={nodesLoaded && machinesLoaded && props.loaded}
      aria-label={t('public~MachineSets')}
      columns={machineSetTableColumn}
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

  const [data, filteredData, onFilterChange] = useListPageFilter(machineSets);

  const { t } = useTranslation();
  return (
    <>
      <ListPageHeader title={showTitle ? t('public~MachineSets') : undefined}>
        <ListPageCreate groupVersionKind={referenceForModel(MachineSetModel)}>
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

export const MachineSetDetailsPage: React.SFC<MachineSetDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    kind={machineSetReference}
    pages={[
      navFactory.details(MachineSetDetails),
      navFactory.editYaml(),
      navFactory.machines(MachineTabPage),
      navFactory.events(ResourceEventStream),
    ]}
  />
);

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

export type MachineSetDetailsPageProps = {
  match: any;
};
