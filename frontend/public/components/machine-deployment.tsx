import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { getMachineAWSPlacement, getMachineRole } from '@console/shared';
import { MachineModel, MachineDeploymentModel } from '../models';
import { MachineDeploymentKind, referenceForModel } from '../module/k8s';
import {
  editCountAction,
  getDesiredReplicas,
  getReadyReplicas,
  MachineCounts,
  MachineTabPage,
} from './machine-set';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  Kebab,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  navFactory,
  pluralize,
  resourcePath,
} from './utils';
import { formatDuration } from './utils/datetime';

const { common } = Kebab.factory;
const menuActions = [
  editCountAction,
  ...Kebab.getExtensionsActionsForKind(MachineDeploymentModel),
  ...common,
];
const machineReference = referenceForModel(MachineModel);
const machineDeploymentReference = referenceForModel(MachineDeploymentModel);

const tableColumnClasses = [
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

const MachineDeploymentTableHeader = () => {
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
MachineDeploymentTableHeader.displayName = 'MachineDeploymentTableHeader';

const MachineDeploymentTableRow: RowFunction<MachineDeploymentKind> = ({
  obj,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={machineDeploymentReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link
          to={`${resourcePath(
            machineDeploymentReference,
            obj.metadata.name,
            obj.metadata.namespace,
          )}/machines`}
        >
          {getReadyReplicas(obj)} of {getDesiredReplicas(obj)} machines
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={machineDeploymentReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const MachineDeploymentDetails: React.SFC<MachineDeploymentDetailsProps> = ({ obj }) => {
  const machineRole = getMachineRole(obj);
  const { availabilityZone, region } = getMachineAWSPlacement(obj);
  const { minReadySeconds, progressDeadlineSeconds } = obj.spec;
  const rollingUpdateStrategy = _.get(obj, 'spec.strategy.rollingUpdate');
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Machine Deployment Details" />
        <MachineCounts resourceKind={MachineDeploymentModel} resource={obj} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj}>
              <dt>Selector</dt>
              <dd>
                <Selector
                  kind={machineReference}
                  selector={_.get(obj, 'spec.selector')}
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
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <dt>Strategy</dt>
              <dd>{_.get(obj, 'spec.strategy.type') || '-'}</dd>
              {rollingUpdateStrategy && (
                <>
                  <dt>Max Unavailable</dt>
                  <dd>
                    {rollingUpdateStrategy.maxUnavailable || 0} of{' '}
                    {pluralize(obj.spec.replicas, 'machine')}
                  </dd>
                  <dt>Max Surge</dt>
                  <dd>
                    {rollingUpdateStrategy.maxSurge || 1} greater than{' '}
                    {pluralize(obj.spec.replicas, 'machine')}
                  </dd>
                </>
              )}
              <dt>Min Ready Seconds</dt>
              <dd>{minReadySeconds ? pluralize(minReadySeconds, 'second') : 'Not Configured'}</dd>
              {progressDeadlineSeconds && <dt>Progress Deadline</dt>}
              {progressDeadlineSeconds && (
                <dd>
                  {/* Convert to ms for formatDuration */ formatDuration(
                    progressDeadlineSeconds * 1000,
                  )}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

export const MachineDeploymentList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label="Machine Deployments"
    Header={MachineDeploymentTableHeader}
    Row={MachineDeploymentTableRow}
    virtualize
  />
);

export const MachineDeploymentPage: React.SFC<MachineDeploymentPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineDeploymentList}
    kind={machineDeploymentReference}
    canCreate
  />
);

export const MachineDeploymentDetailsPage: React.SFC<MachineDeploymentDetailsPageProps> = (
  props,
) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    kind={machineDeploymentReference}
    pages={[
      navFactory.details(MachineDeploymentDetails),
      navFactory.editYaml(),
      navFactory.machines(MachineTabPage),
    ]}
  />
);

export type MachineDeploymentDetailsProps = {
  obj: MachineDeploymentKind;
};

export type MachineDeploymentPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

export type MachineDeploymentDetailsPageProps = {
  match: any;
};
