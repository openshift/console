import React from 'react';
import ReactTooltip from 'react-tooltip';

import {angulars} from './react-wrapper';
import {SafetyFirst} from './safety-first';
import {Header, rowOfKind} from './workloads';
import {configureReplicaCountModal} from './modals';
import {makeListPage, makeList, makeDetailsPage} from './factory';
import {navFactory, LoadingInline, pluralize, ResourceSummary} from './utils';

export class Details extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      desiredCountOutdated: false
    };
    this._openReplicaCountModal = this._openReplicaCountModal.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    ReactTooltip.rebuild();
  }

  componentWillReceiveProps() {
    this.setState({
      desiredCountOutdated: false
    });
  }

  _openReplicaCountModal(event) {
    event.target.blur();
    configureReplicaCountModal({
      resourceKind: angulars.k8s.kinds.DEPLOYMENT,
      resource: this.props,
      invalidateState: (isInvalid) => {
        this.setState({
          desiredCountOutdated: isInvalid
        });
      }
    });
  }

  render() {
    const deployment = this.props;
    const isRecreate = (deployment.spec.strategy.type === 'Recreate');

    return <div>
      <div className="co-m-pane__body-group">
        <div className="co-m-pane__body-section--bordered">
          <div className="row no-gutter">
            <div className="co-deployment-pods">
              <div className="co-deployment-pods__row row">
                <div className="co-deployment-pods__section col-sm-3">
                  <dl className="co-deployment-pods__list">
                    <dt className="co-deployment-pods__list-term">Desired Count</dt>
                    <dd>{this.state.desiredCountOutdated ? <LoadingInline /> : <a className="co-m-modal-link" href="#" onClick={this._openReplicaCountModal}>{pluralize(deployment.spec.replicas, 'pod')}</a>}</dd>
                  </dl>
                </div>
                <div className="co-deployment-pods__section col-sm-3">
                  <dl className="co-deployment-pods__list">
                    <dt className="co-deployment-pods__list-term">Up-to-date Count</dt>
                    <dd data-tip="Total number of non-terminated pods targeted by this deployment that have the desired template spec">{pluralize(deployment.status.updatedReplicas, 'pod')}</dd>
                  </dl>
                </div>
                <div className="co-deployment-pods__section co-deployment-pods__section--last col-sm-6">
                  <div className="co-deployment-pods__available-wrapper">
                    <div className="co-deployment-pods__available">
                      <dl className="co-deployment-pods__list">
                        <dt className="co-deployment-pods__list-term">Matching Pods</dt>
                        <dd data-tip="Total number of non-terminated pods targeted by this deployment (their labels match the selector)">{pluralize(deployment.status.replicas, 'pod')}</dd>
                      </dl>
                    </div>
                    <div className="co-deployment-pods__bracket"></div>
                    <div className="co-deployment-pods__breakdown">
                      <div className="co-deployment-pods__list">
                        <span className="co-deployment-pods__breakdown-item co-deployment-pods__breakdown-item--first" data-tip="Total number of available pods (ready for at least minReadySeconds) targeted by this deployment">{deployment.status.availableReplicas || 0} available</span>
                        <span className="co-deployment-pods__breakdown-item co-deployment-pods__breakdown-item--last" data-tip="Total number of unavailable pods targeted by this deployment">{deployment.status.unavailableReplicas || 0} unavailable</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="co-m-pane__body-group">
        <div className="co-m-pane__body-section--bordered">
          <div className="row no-gutter">
            <div className="col-sm-6">
              <dt>Status</dt>
              <dd>{deployment.status.availableReplicas === deployment.status.updatedReplicas ? <span>Active</span> : <div><span className="co-icon-space-r"><LoadingInline /></span> Updating</div>}</dd>
              <ResourceSummary resource={deployment} />
            </div>
            <div className="col-sm-6">
              <dl>
                <dt>Update Strategy</dt>
                <dd>{deployment.spec.strategy.type || 'RollingUpdate'}</dd>
                {isRecreate || <dt>Max Unavailable</dt>}
                {isRecreate || <dd>{deployment.spec.strategy.rollingUpdate.maxUnavailable || 1} of {pluralize(deployment.spec.replicas, 'pod')}</dd>}
                {isRecreate || <dt>Max Surge</dt>}
                {isRecreate || <dd>{deployment.spec.strategy.rollingUpdate.maxSurge || 1} greater than {pluralize(deployment.spec.replicas, 'pod')}</dd>}
                <dt>Min Ready Seconds</dt>
                <dd>{deployment.spec.minReadySeconds ? pluralize(deployment.spec.minReadySeconds, 'second') : 'Not Configured'}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }
}

const {details, edit, editYaml, pods} = navFactory;
const pages = [details(Details), edit(), editYaml(), pods()];
const DeploymentsDetailsPage = makeDetailsPage('DeploymentsDetailsPage', 'deployment', pages);

const DeploymentsList = makeList('Deployments', 'deployment', Header, rowOfKind('deployment'));
const DeploymentsPage = makeListPage('DeploymentsPage', 'deployment', DeploymentsList);

export {DeploymentsList, DeploymentsPage, DeploymentsDetailsPage};
