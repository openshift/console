import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';

import { impersonateStateToProps } from '../../reducers/ui';
import { AccessReviewResourceAttributes, K8sKind, K8sResourceKind, SelfSubjectAccessReviewKind } from '../../module/k8s';
import { configureReplicaCountModal } from '../modals';
import { checkAccess, LoadingInline, pluralize } from './';
import { Tooltip } from './tooltip';


type DPCProps = {
  resource: K8sResourceKind;
  resourceKind: K8sKind;
};

type DPCState = {
  desiredCount: number;
  waitingForUpdate: boolean;
  editable: boolean;
};

// Common representation of desired / up-to-date / matching pods for Deployment like things
class DeploymentPodCounts_ extends React.Component<DPCProps & { impersonate?: string }, DPCState> {
  openReplicaCountModal: any;

  constructor(props) {
    super(props);

    this.state = {
      desiredCount: -1,
      waitingForUpdate: false,
      editable: false,
    };

    this.openReplicaCountModal = event => {
      event.preventDefault();
      event.target.blur();

      const {resourceKind, resource} = this.props;

      configureReplicaCountModal({
        resourceKind, resource,
        invalidateState: (waitingForUpdate, desiredCount) => this.setState({waitingForUpdate, desiredCount}),
      });
    };
  }

  componentDidMount() {
    this.checkEditAccess();
  }

  componentDidUpdate(prevProps: DPCProps) {
    const { resource, resourceKind } = this.props;
    if (_.get(prevProps.resource, 'metadata.uid') !== _.get(resource, 'metadata.uid') ||
        _.get(prevProps.resourceKind, 'apiGroup') !== _.get(resourceKind, 'apiGroup') ||
        _.get(prevProps.resourceKind, 'path') !== _.get(resourceKind, 'path')) {
      this.checkEditAccess();
    }
  }

  static getDerivedStateFromProps(nextProps: DPCProps, nextState: DPCState) {
    if (!nextState.waitingForUpdate) {
      return null;
    }

    if (_.get(nextProps, 'resource.spec.replicas') !== nextState.desiredCount) {
      return null;
    }

    return { waitingForUpdate: false, desiredCount: -1 };
  }

  checkEditAccess() {
    const { resource, resourceKind: model, impersonate } = this.props;
    if (_.isEmpty(resource) || !model) {
      return;
    }
    const { name, namespace } = resource.metadata;
    const resourceAttributes: AccessReviewResourceAttributes = {
      group: model.apiGroup,
      resource: model.plural,
      verb: 'patch',
      name,
      namespace,
    };
    checkAccess(resourceAttributes, impersonate).then((resp: SelfSubjectAccessReviewKind) => this.setState({ editable: resp.status.allowed }));
  }

  render() {
    const { resource, resourceKind } = this.props;
    const { editable } = this.state;
    const { spec, status } = resource;

    const podCount = editable
      ? <button type="button" className="btn btn-link co-modal-btn-link" onClick={this.openReplicaCountModal}>{ pluralize(spec.replicas, 'pod') }</button>
      : pluralize(spec.replicas, 'pod');

    return <div className="co-m-pane__body-group">
      <div className="co-detail-table">
        <div className="co-detail-table__row row">
          <div className="co-detail-table__section col-sm-3">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Desired Count</dt>
              <dd>{this.state.waitingForUpdate ? <LoadingInline /> : podCount}</dd>
            </dl>
          </div>
          <div className="co-detail-table__section col-sm-3">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Up-to-date Count</dt>
              <dd>
                <Tooltip content={`Total number of non-terminated pods targeted by this ${resourceKind.label} that have the desired template spec.`}>
                  {pluralize(status.updatedReplicas, 'pod')}
                </Tooltip>
              </dd>
            </dl>
          </div>
          <div className="co-detail-table__section co-detail-table__section--last col-sm-6">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Matching Pods</dt>
              <dd>
                <Tooltip content={`Total number of non-terminated pods targeted by this ${resourceKind.label} (their labels match the selector).`}>
                  {pluralize(status.replicas, 'pod')}
                </Tooltip>
              </dd>
            </dl>
            <div className="co-detail-table__bracket"></div>
            <div className="co-detail-table__breakdown">
              <Tooltip content="Total number of available pods (ready for at least minReadySeconds) targeted by this deployment.">
                {status.availableReplicas || 0} available
              </Tooltip>
              <Tooltip content={`Total number of unavailable pods targeted by this ${resourceKind.label}.`}>{status.unavailableReplicas || 0} unavailable</Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
}

export const DeploymentPodCounts = connect<{ impersonate?: string }, {}, DPCProps>(impersonateStateToProps)(DeploymentPodCounts_);
