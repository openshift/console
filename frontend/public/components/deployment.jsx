import React from 'react';
import ReactTooltip from 'react-tooltip';

import {angulars} from './react-wrapper';
import {makeListPage, makeList, makeDetailsPage} from './factory';
import {Header, rowOfKindstring} from './workloads';
import {detailsPage, LoadingInline, pluralize, ResourceSummary} from './utils';

export const Details = (deployment) => {
  const openVolumesModal = angulars.modal('configure-replica-count', {
    resourceKind: angulars.k8s.kinds.DEPLOYMENT,
    resource: deployment,
  });

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
                  <dd><a className="co-m-modal-link" href="#" onClick={openVolumesModal}>{pluralize(deployment.spec.replicas, 'pod')}</a></dd>
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
    <ReactTooltip class="co-tooltip" place="bottom" effect="solid" />
  </div>;
};

// TODO: Edit page is still routed to Angular code for now
const Edit = null;

const kind = 'DEPLOYMENT';

const {factory: {pods}} = detailsPage;
const pages = [
  {href: 'details', name: 'Overview', component: Details},
  {href: 'edit', name: 'Edit', component: Edit},
  pods()
];
const DeploymentsDetailsPage = makeDetailsPage('DeploymentsDetailsPage', kind, pages);

const DeploymentsList = makeList('Deployments', kind, Header, rowOfKindstring(kind));
const DeploymentsPage = makeListPage('DeploymentsPage', kind, DeploymentsList);

export {DeploymentsList, DeploymentsPage, DeploymentsDetailsPage};
