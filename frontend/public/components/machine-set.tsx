import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { getMachineAWSPlacement, getMachineRole } from '@console/shared';
import { Tooltip, Button } from '@patternfly/react-core';

import { PencilAltIcon } from '@patternfly/react-icons';

import { MachineAutoscalerModel, MachineModel, MachineSetModel } from '../models';
import { K8sKind, MachineDeploymentKind, MachineSetKind, referenceForModel } from '../module/k8s';
import { MachinePage } from './machine';
import { configureMachineAutoscalerModal, configureReplicaCountModal } from './modals';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  Kebab,
  KebabAction,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  navFactory,
  pluralize,
  resourcePath,
  useAccessReview,
} from './utils';
import { ResourceEventStream } from './events';

const machineReplicasModal = (
  resourceKind: K8sKind,
  resource: MachineSetKind | MachineDeploymentKind,
) =>
  configureReplicaCountModal({
    resourceKind,
    resource,
    title: 'Edit Machine Count',
    message: `${resourceKind.labelPlural} maintain the proper number of healthy machines.`,
  });

export const editCountAction: KebabAction = (
  kind: K8sKind,
  resource: MachineSetKind | MachineDeploymentKind,
) => ({
  label: 'Edit Machine Count',
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
  label: 'Create Autoscaler',
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
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

const MachineSetTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Machines',
      sortField: 'status.replicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
MachineSetTableHeader.displayName = 'MachineSetTableHeader';

const MachineSetTableRow: RowFunction<MachineSetKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={machineSetReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
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
          {getReadyReplicas(obj)} of {getDesiredReplicas(obj)} machines
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={machineSetReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export const MachineCounts: React.SFC<MachineCountsProps> = ({
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

  const desiredReplicasText = pluralize(desiredReplicas, 'machine');
  return (
    <div className="co-m-pane__body-group">
      <div className="co-detail-table">
        <div className="co-detail-table__row row">
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Desired Count</dt>
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
              <dt className="co-detail-table__section-header">Current Count</dt>
              <dd>
                <Tooltip content="The most recently observed number of replicas.">
                  <span>{pluralize(replicas, 'machine')}</span>
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Ready Count</dt>
              <dd>
                <Tooltip content="The number of ready replicas for this MachineSet. A machine is considered ready when the node has been created and is ready.">
                  <span>{pluralize(readyReplicas, 'machine')}</span>
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section co-detail-table__section--last">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Available Count</dt>
              <dd>
                <Tooltip content="The number of available replicas (ready for at least minReadySeconds) for this MachineSet.">
                  <span>{pluralize(availableReplicas, 'machine')}</span>
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
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Machine Set Details" />
        <MachineCounts resourceKind={MachineSetModel} resource={obj} />
        <ResourceSummary resource={obj}>
          <dt>Selector</dt>
          <dd>
            <Selector
              kind={machineReference}
              selector={obj.spec?.selector}
              namespace={obj.metadata.namespace}
            />
          </dd>
          {machineRole && (
            <>
              <dt>Machine Role</dt>
              <dd>{machineRole}</dd>
            </>
          )}
          {region && (
            <>
              <dt>Region</dt>
              <dd>{region}</dd>
            </>
          )}
          {availabilityZone && (
            <>
              <dt>Availability Zone</dt>
              <dd>{availabilityZone}</dd>
            </>
          )}
        </ResourceSummary>
      </div>
    </>
  );
};

export const MachineSetList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label="Machine Sets"
    Header={MachineSetTableHeader}
    Row={MachineSetTableRow}
    virtualize
  />
);

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
