/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';

import { K8sResourceKind, K8sResourceKindReference, referenceForModel } from '../../module/k8s';
import { ClusterOperatorModel } from '../../models';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from '../factory';
import {
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from '../utils';

enum OperatorStatus {
  Available = 'Available',
  Updating = 'Updating',
  Failing = 'Failing',
  Unknown = 'Unknown',
}

export const clusterOperatorReference: K8sResourceKindReference = referenceForModel(ClusterOperatorModel);

const getStatusAndMessage = (operator: K8sResourceKind) => {
  const conditions = _.get(operator, 'status.conditions');
  const failing: any = _.find(conditions, { type: 'Failing', status: 'True' });
  if (failing) {
    return { status: OperatorStatus.Failing, message: failing.message };
  }

  const progressing: any = _.find(conditions, { type: 'Progressing', status: 'True' });
  if (progressing) {
    return { status: OperatorStatus.Updating, message: progressing.message };
  }

  const available: any = _.find(conditions, { type: 'Available', status: 'True' });
  if (available) {
    return { status: OperatorStatus.Available, message: available.message };
  }

  return { status: OperatorStatus.Unknown, message: '' };
};

export const getClusterOperatorStatus = (operator: K8sResourceKind) => {
  const { status } = getStatusAndMessage(operator);
  return status;
};

const getIconClass = (status: OperatorStatus) => {
  return {
    [OperatorStatus.Available]: 'pficon pficon-ok text-success',
    [OperatorStatus.Updating]: 'fa-spin pficon pficon-in-progress',
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

const connectToMockClusterUpgrade = ({UI}) => {
  const mockStatus = UI.getIn(['mockClusterUpdate', 'status']) === OperatorStatus.Updating ? OperatorStatus.Updating : undefined;
  const mockTargetVersion = UI.getIn(['mockClusterUpdate', 'targetVersion']);
  return { mockStatus, mockTargetVersion };
};

const ClusterOperatorRow = connect(connectToMockClusterUpgrade)(
  ({obj, mockStatus, mockTargetVersion}: ClusterOperatorRowProps & PropsFromMockUpdgrade) => {
    const mockMessage = mockTargetVersion ? `Progressing to ${mockTargetVersion}` : undefined;
    const { status, message } = getStatusAndMessage(obj);
    return <div className="row co-resource-list__item">
      <div className="col-md-3 col-sm-3 col-xs-6">
        <ResourceLink kind={clusterOperatorReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </div>
      <div className="col-md-2 col-sm-3 col-xs-6">
        <OperatorStatusIconAndLabel status={mockStatus || status} />
      </div>
      <div className="col-md-4 col-sm-3 hidden-xs">
        {mockMessage || message ? _.truncate(mockMessage || message, { length: 256, separator: ' ' }) : '-'}
      </div>
      <div className="col-md-3 col-sm-3 hidden-xs">
        {obj.status.version || <span className="text-muted">Unknown</span>}
      </div>
    </div>;
  });

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

const ClusterOperatorDetails = connect(connectToMockClusterUpgrade)(
  ({obj, mockStatus, mockTargetVersion}: ClusterOperatorDetailsProps & PropsFromMockUpdgrade) => {
    const { status, message } = getStatusAndMessage(obj);
    const mockMessage = mockTargetVersion ? `Progressing to ${mockTargetVersion}` : undefined;
    return <div className="co-m-pane__body">
      <SectionHeading text="Cluster Operator Overview" />
      <ResourceSummary resource={obj} showPodSelector={false} showNodeSelector={false}>
        <dt>Status</dt>
        <dd><OperatorStatusIconAndLabel status={mockStatus || status} /></dd>
        <dt>Message</dt>
        <dd>{mockMessage || message || '-'}</dd>
      </ResourceSummary>
    </div>;
  });

export const ClusterOperatorDetailsPage: React.SFC<ClusterOperatorDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={clusterOperatorReference}
    pages={[navFactory.details(ClusterOperatorDetails), navFactory.editYaml()]}
  />;

type PropsFromMockUpdgrade = {
  mockStatus: OperatorStatus;
  mockTargetVersion: string;
};

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
