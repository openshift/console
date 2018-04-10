import * as React from 'react';
import { Tooltip } from 'react-lightweight-tooltip';

import { K8sKind, K8sResourceKind } from '../../module/k8s';
import { LoadingInline, pluralize } from './';

// Common representation of desired / up-to-date / matching pods for both k8s Deployments and OpenShift Deployment Configs.
export const DeploymentPodCounts: React.SFC<DeploymentPodCountsProps> = ({ resource, resourceKind, desiredCountOutdated, openReplicaCountModal }) => {
  const { spec, status } = resource;

  return <div className="co-m-pane__body-group">
    <div className="row no-gutter">
      <div className="co-detail-table">
        <div className="co-detail-table__row row">
          <div className="co-detail-table__section col-sm-3">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Desired Count</dt>
              <dd>{desiredCountOutdated ? <LoadingInline /> : <a className="co-m-modal-link" href="#" onClick={openReplicaCountModal}>{pluralize(spec.replicas, 'pod')}</a>}</dd>
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
    </div>
  </div>;
};

/* eslint-disable no-undef */
export type DeploymentPodCountsProps = {
  resource: K8sResourceKind;
  resourceKind: K8sKind;
  desiredCountOutdated: boolean;
  openReplicaCountModal: (event: React.MouseEvent<HTMLElement>) => void;
};
/* eslint-enable no-undef */

DeploymentPodCounts.displayName = 'DeploymentPodCounts';
