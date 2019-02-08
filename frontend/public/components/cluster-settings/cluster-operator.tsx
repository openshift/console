/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import * as _ from 'lodash-es';

import { ClusterOperatorModel } from '../../models';
import {
  ColHead,
  DetailsPage,
  List,
  ListHeader,
  ListPage,
} from '../factory';
import {
  getClusterOperatorStatus,
  getStatusAndMessage,
  K8sResourceKind,
  K8sResourceKindReference,
  OperatorStatus,
  referenceForModel,
} from '../../module/k8s';
import {
  navFactory,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from '../utils';

export const clusterOperatorReference: K8sResourceKindReference = referenceForModel(ClusterOperatorModel);

const getIconClass = (status: OperatorStatus) => {
  return {
    [OperatorStatus.Available]: 'pficon pficon-ok text-success',
    [OperatorStatus.Updating]: 'pficon pficon-in-progress',
    [OperatorStatus.Failing]: 'pficon pficon-error-circle-o text-danger',
  }[status];
};

const OperatorStatusIconAndLabel: React.SFC<OperatorStatusIconAndLabelProps> = ({status}) => {
  const iconClass = getIconClass(status);
  return status === OperatorStatus.Unknown
    ? <span className="text-muted">Unknown</span>
    : <React.Fragment><i className={iconClass} aria-hidden="true" /> {status}</React.Fragment>;
};

const ClusterOperatorHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-3 col-xs-6" sortFunc="getClusterOperatorStatus">Status</ColHead>
  <ColHead {...props} className="col-md-4 col-sm-3 hidden-xs">Message</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-3 hidden-xs" sortField="status.version">Version</ColHead>
</ListHeader>;

const ClusterOperatorRow: React.SFC<ClusterOperatorRowProps> = ({obj}) => {
  const { status, message } = getStatusAndMessage(obj);
  return <div className="row co-resource-list__item">
    <div className="col-md-3 col-sm-3 col-xs-6">
      <ResourceLink kind={clusterOperatorReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-md-2 col-sm-3 col-xs-6">
      <OperatorStatusIconAndLabel status={status} />
    </div>
    <div className="col-md-4 col-sm-3 hidden-xs">
      {message ? _.truncate(message, { length: 256, separator: ' ' }) : '-'}
    </div>
    <div className="col-md-3 col-sm-3 hidden-xs">
      {obj.status.version || <span className="text-muted">Unknown</span>}
    </div>
  </div>;
};

export const ClusterOperatorList: React.SFC = props => <List {...props} Header={ClusterOperatorHeader} Row={ClusterOperatorRow} />;

const allStatuses = [
  OperatorStatus.Available,
  OperatorStatus.Updating,
  OperatorStatus.Failing,
  OperatorStatus.Unknown,
];

const filters = [{
  type: 'cluster-operator-status',
  selected: allStatuses,
  reducer: getClusterOperatorStatus,
  items: _.map(allStatuses, phase => ({
    id: phase,
    title: phase,
  })),
}];

export const ClusterOperatorPage: React.SFC<ClusterOperatorPageProps> = props =>
  <ListPage
    {...props}
    title="Cluster Operators"
    kind={clusterOperatorReference}
    ListComponent={ClusterOperatorList}
    canCreate={false}
    rowFilters={filters}
  />;

const ClusterOperatorDetails: React.SFC<ClusterOperatorDetailsProps> = ({obj}) => {
  const { status, message } = getStatusAndMessage(obj);
  return <div className="co-m-pane__body">
    <SectionHeading text="Cluster Operator Overview" />
    <ResourceSummary resource={obj} showPodSelector={false} showNodeSelector={false}>
      <dt>Status</dt>
      <dd><OperatorStatusIconAndLabel status={status} /></dd>
      <dt>Message</dt>
      <dd>{message || '-'}</dd>
    </ResourceSummary>
  </div>;
};

export const ClusterOperatorDetailsPage: React.SFC<ClusterOperatorDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={clusterOperatorReference}
    pages={[navFactory.details(ClusterOperatorDetails), navFactory.editYaml()]}
  />;

type OperatorStatusIconAndLabelProps = {
  status: OperatorStatus;
};

type ClusterOperatorRowProps = {
  obj: K8sResourceKind;
};

type ClusterOperatorPageProps = {
  autoFocus?: boolean;
  showTitle?: boolean;
};

type ClusterOperatorDetailsProps = {
  obj: K8sResourceKind;
};

type ClusterOperatorDetailsPageProps = {
  match: any;
};
