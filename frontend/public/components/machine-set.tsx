/* eslint-disable no-undef, no-unused-vars */
import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';

import { MachineModel, MachineSetModel } from '../models';
import { MachineSetKind, referenceForModel } from '../module/k8s';
import { getMachineRole, MachinePage } from './machine';
import { configureReplicaCountModal } from './modals';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
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
import { Tooltip } from './utils/tooltip';

const { common } = Kebab.factory;
const menuActions = [...common];
const machineReference = referenceForModel(MachineModel);
const machineSetReference = referenceForModel(MachineSetModel);
const getAWSPlacement = (machine: MachineSetKind) => _.get(machine, 'spec.template.spec.providerConfig.value.placement') || {};

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
      {obj.status.readyReplicas} of {obj.spec.replicas} machines
    </Link>
  </div>
  <div className="co-kebab-wrapper">
    <ResourceKebab actions={menuActions} kind={machineSetReference} resource={obj} />
  </div>
</div>;

const MachineSetCounts: React.SFC<MachineSetCountsProps> = ({resource}: {resource: MachineSetKind}) => {
  const { spec, status } = resource;

  const openReplicaCountModal = (event) => {
    event.preventDefault();
    configureReplicaCountModal({
      resourceKind: MachineSetModel,
      resource,
      message: 'Machine sets maintain the proper number of healthy machines.',
    });
  };

  return <div className="co-m-pane__body-group">
    <div className="co-detail-table">
      <div className="co-detail-table__row row">
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Desired Count</dt>
            <dd>
              <button type="button" className="btn btn-link co-m-modal-link" onClick={openReplicaCountModal}>
                {pluralize(spec.replicas, 'machine')}
              </button>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Current Count</dt>
            <dd>
              <Tooltip content="The most recently observed number of replicas.">
                {pluralize(status.replicas, 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Ready Count</dt>
            <dd>
              <Tooltip content="The number of ready replicas for this MachineSet. A machine is considered ready when the node has been created and is ready.">
                {pluralize(status.readyReplicas, 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
        <div className="co-detail-table__section co-detail-table__section--last">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Available Count</dt>
            <dd>
              <Tooltip content="The number of available replicas (ready for at least minReadySeconds) for this MachineSet.">
                {pluralize(status.availableReplicas, 'machine')}
              </Tooltip>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>;
};

const MachineTabPage: React.SFC<MachineTabPageProps> = ({obj}: {obj: MachineSetKind}) =>
  <MachinePage namespace={obj.metadata.namespace} showTitle={false} selector={obj.spec.selector} />;

const MachineSetDetails: React.SFC<MachineSetDetailsProps> = ({obj}) => {
  const machineRole = getMachineRole(obj);
  const { availabilityZone, region } = getAWSPlacement(obj);
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Machine Set Overview" />
      <MachineSetCounts resource={obj} />
      <ResourceSummary resource={obj} showPodSelector={false} showNodeSelector={false}>
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
    canCreate={false}
  />;

export const MachineSetDetailsPage: React.SFC<MachineSetDetailsPageProps> = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  kind={machineSetReference}
  pages={[navFactory.details(MachineSetDetails), navFactory.editYaml(), navFactory.machines(MachineTabPage)]}
/>;

export type MachineSetRowProps = {
  obj: MachineSetKind,
};

export type MachineSetCountsProps = {
  resource: MachineSetKind,
};

export type MachineTabPageProps = {
  obj: MachineSetKind,
};

export type MachineSetDetailsProps = {
  obj: MachineSetKind,
};

export type MachineSetPageProps = {
  showTitle?: boolean,
  namespace?: string,
  selector?: any,
};

export type MachineSetDetailsPageProps = {
  match: any,
};
