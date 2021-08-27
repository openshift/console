import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { getMachineAWSPlacement, getMachineRole, getMachineSetInstanceType } from '@console/shared';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
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
} from '../module/k8s';
import { MachinePage } from './machine';
import { configureMachineAutoscalerModal, configureReplicaCountModal } from './modals';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
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

const MachinesResource: WatchK8sResource = {
  isList: true,
  kind: referenceForModel(MachineModel),
};

const NodesResource: WatchK8sResource = {
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

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
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
        <SectionHeading text={t('public~Machine set details')} />
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

export const MachineSetList: React.FC = (props) => {
  const { t } = useTranslation();
  const [machines, machinesLoaded] = useK8sWatchResource<MachineKind[]>(MachinesResource);
  const [nodes, nodesLoaded] = useK8sWatchResource<NodeKind[]>(NodesResource);

  const MachineSetTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('public~Machines'),
        sortField: 'status.readyReplicas',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Instance type'),
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~CPU'),
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('public~Memory'),
        props: { className: tableColumnClasses[5] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[6] },
      },
    ];
  };

  const MachineSetTableRow: React.FC<RowFunctionArgs<MachineSetKind>> = ({ obj }) => {
    const relatedMachines =
      machinesLoaded &&
      machines?.filter(
        (machine) =>
          machine.metadata.labels?.['machine.openshift.io/cluster-api-machineset'] ===
          obj.metadata.name,
      );
    const relatedNodes =
      nodesLoaded && relatedMachines.length > 0
        ? nodes.filter((node) =>
            relatedMachines.some((machine) => node.metadata.uid === machine.status?.nodeRef?.uid),
          )
        : [];
    const numCores =
      nodesLoaded && relatedNodes.length > 0
        ? convertToBaseValue(relatedNodes[0].status?.capacity.cpu) ?? 0
        : 0;
    const memory =
      nodesLoaded && relatedNodes.length > 0
        ? formatBytesAsGiB(convertToBaseValue(relatedNodes[0].status?.capacity.memory) ?? 0)
        : 0;

    return (
      <>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink
            kind={machineSetReference}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        </TableData>
        <TableData
          className={classNames(tableColumnClasses[1], 'co-break-word')}
          columnID="namespace"
        >
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
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
        <TableData className={tableColumnClasses[3]}>
          {getMachineSetInstanceType(obj) || '-'}
        </TableData>
        <TableData className={tableColumnClasses[4]}>
          {t('public~{{numCores}} cores', {
            numCores,
          })}
        </TableData>
        <TableData className={tableColumnClasses[5]}>
          {t('public~{{memory}} GiB', {
            memory,
          })}
        </TableData>
        <TableData className={tableColumnClasses[6]}>
          <ResourceKebab actions={menuActions} kind={machineSetReference} resource={obj} />
        </TableData>
      </>
    );
  };
  return (
    <Table
      {...props}
      aria-label={t('public~Machine sets')}
      Header={MachineSetTableHeader}
      Row={MachineSetTableRow}
      virtualize
    />
  );
};

export const MachineSetPage: React.SFC<MachineSetPageProps> = (props) => (
  <ListPage {...props} ListComponent={MachineSetList} kind={machineSetReference} canCreate />
);

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
  selector?: any;
};

export type MachineSetDetailsPageProps = {
  match: any;
};
