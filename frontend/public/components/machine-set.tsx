/* eslint-disable no-undef, no-unused-vars */
import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';

import { MachineModel, MachineSetModel } from '../models';
import { K8sKind, MachineDeploymentKind, MachineSetKind, referenceForModel } from '../module/k8s';
import { getMachineRole, MachinePage } from './machine';
import { configureReplicaCountModal } from './modals';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
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
} from './utils';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { Tooltip } from './utils/tooltip';

const machineReplicasModal = (resourceKind: K8sKind, resource: MachineSetKind | MachineDeploymentKind) => configureReplicaCountModal({
  resourceKind,
  resource,
  message: `${resourceKind.labelPlural} maintain the proper number of healthy machines.`,
});

export const editCountAction: KebabAction = (kind: K8sKind, resource: MachineSetKind | MachineDeploymentKind) => ({
  label: 'Edit Count',
  callback: () => machineReplicasModal(kind, resource),
});

const { common } = Kebab.factory;
const menuActions = [editCountAction, ...common];
const machineReference = referenceForModel(MachineModel);
const machineSetReference = referenceForModel(MachineSetModel);
export const getAWSPlacement = (machineSet: MachineSetKind | MachineDeploymentKind) => _.get(machineSet, 'spec.template.spec.providerSpec.value.placement') || {};

// `spec.replicas` defaults to 1 if not specified. Make sure to differentiate between undefined and 0.
export const getDesiredReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) => {
  const replicas = _.get(machineSet, 'spec.replicas');
  return _.isNil(replicas) ? 1 : replicas;
};

const getReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) => _.get(machineSet, 'status.replicas', 0);
export const getReadyReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) => _.get(machineSet, 'status.readyReplicas', 0);
export const getAvailableReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) => _.get(machineSet, 'status.availableReplicas', 0);

const MachineSetHeader: React.SFC = props => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs" sortField="status.replicas">Machines</ColHead>
</ListHeader>;

const MachineSetRow: React.SFC<MachineSetRowProps> = ({obj}: {obj: MachineSetKind}) => <div className="row co-resource-list__item">
  <div className="col-sm-4 col-xs-6">
    <ResourceLink kind={machineSetReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
  </div>
  <div className="col-sm-4 hidden-xs">
    <Link to={`${resourcePath(machineSetReference, obj.metadata.name, obj.metadata.namespace)}/machines`}>
      {getReadyReplicas(obj)} of {getDesiredReplicas(obj)} machines
    </Link>
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={machineSetReference} resource={obj} />
  </div>
</div>;

export const MachineCounts: React.SFC<MachineCountsProps> = ({resourceKind, resource}: {resourceKind: K8sKind, resource: MachineSetKind | MachineDeploymentKind}) => {
  const editReplicas = (event) => {
    event.preventDefault();
    machineReplicasModal(resourceKind, resource);
  };

  const desiredReplicas = getDesiredReplicas(resource);
  const replicas = getReplicas(resource);
  const readyReplicas = getReadyReplicas(resource);
  const availableReplicas = getAvailableReplicas(resource);

  return <div className="co-m-pane__body-group">
    <div className="co-detail-table">
      <div className="co-detail-table__row row">
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Desired Count</dt>
            <dd>
              <button type="button" className="btn btn-link co-m-modal-link" onClick={editReplicas}>
                {pluralize(desiredReplicas, 'machine')}
              </button>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Current Count</dt>
            <dd>
              <Tooltip content="The most recently observed number of replicas.">
                {pluralize(replicas, 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Ready Count</dt>
            <dd>
              <Tooltip content="The number of ready replicas for this MachineSet. A machine is considered ready when the node has been created and is ready.">
                {pluralize(readyReplicas, 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section co-detail-table__section--last">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Available Count</dt>
            <dd>
              <Tooltip content="The number of available replicas (ready for at least minReadySeconds) for this MachineSet.">
                {pluralize(availableReplicas, 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>;
};

export const MachineTabPage: React.SFC<MachineTabPageProps> = ({obj}: {obj: MachineSetKind}) =>
  <MachinePage namespace={obj.metadata.namespace} showTitle={false} selector={obj.spec.selector} />;

const MachineSetDetails: React.SFC<MachineSetDetailsProps> = ({obj}) => {
  const machineRole = getMachineRole(obj);
  const { availabilityZone, region } = getAWSPlacement(obj);
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Machine Set Overview" />
      <MachineCounts resourceKind={MachineSetModel} resource={obj} />
      <ResourceSummary resource={obj} showNodeSelector={false}>
        <dt>Selector</dt>
        <dd>
          <Selector
            kind={machineReference}
            selector={_.get(obj, 'spec.selector')}
            namespace={obj.metadata.namespace}
          />
        </dd>
        {machineRole && <React.Fragment>
          <dt>Machine Role</dt>
          <dd>{machineRole}</dd>
        </React.Fragment>}
        {region && <React.Fragment>
          <dt>AWS Region</dt>
          <dd>{region}</dd>
        </React.Fragment>}
        {availabilityZone && <React.Fragment>
          <dt>AWS Availability Zone</dt>
          <dd>{availabilityZone}</dd>
        </React.Fragment>}
      </ResourceSummary>
    </div>
  </React.Fragment>;
};

export const MachineSetList: React.SFC = props =>
  <List
    {...props}
    Header={MachineSetHeader}
    Row={MachineSetRow}
  />;

export const MachineSetPage: React.SFC<MachineSetPageProps> = props =>
  <ListPage
    {...props}
    ListComponent={MachineSetList}
    kind={machineSetReference}
    canCreate
  />;

export const MachineSetDetailsPage: React.SFC<MachineSetDetailsPageProps> = props => <DetailsPage
  {...props}
  breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
    name: 'Machine Set Details',
    path: props.match.url,
  })}
  menuActions={menuActions}
  kind={machineSetReference}
  pages={[navFactory.details(MachineSetDetails), navFactory.editYaml(), navFactory.machines(MachineTabPage)]}
/>;

export type MachineSetRowProps = {
  obj: MachineSetKind;
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
  selector?: any;
};

export type MachineSetDetailsPageProps = {
  match: any;
};
