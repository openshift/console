import * as React from 'react';
import { ChartLabel } from '@patternfly/react-charts';
import { ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, OwnerReference, referenceForModel } from '@console/internal/module/k8s';
import { PodStatus } from '@console/shared';
import { RevisionModel } from '../../models';
import { getTrafficByRevision } from '../../utils/get-knative-resources';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';
import RoutesUrlLink from './RoutesUrlLink';

import './RevisionsOverviewListItem.scss';

export type RevisionsOverviewListItemProps = {
  revision: K8sResourceKind;
  service: K8sResourceKind;
};

const RevisionsOverviewListItem: React.FC<RevisionsOverviewListItemProps> = ({
  revision,
  service,
}) => {
  const {
    metadata: { name, namespace },
  } = revision;
  const { pods } = usePodsForRevisions(revision.metadata.uid, namespace);
  const current = pods?.[0];
  const deploymentData = current?.obj?.metadata.ownerReferences?.[0] || ({} as OwnerReference);
  const availableReplicas = current?.obj?.status?.availableReplicas || '0';
  const { urls = [], percent: trafficPercent } = getTrafficByRevision(name, service);
  return (
    <li className="list-group-item">
      <div className="row">
        <div className="col-sm-8 col-xs-9">
          <ResourceLink kind={referenceForModel(RevisionModel)} name={name} namespace={namespace} />
        </div>
        {trafficPercent && (
          <span className="col-sm-4 col-xs-3 pf-u-text-align-right">{trafficPercent}</span>
        )}
      </div>
      {deploymentData.name && (
        <div className="odc-revision-deployment-list">
          <div className="row">
            <div className="col-sm-8 col-xs-9">
              <ResourceLink
                kind={deploymentData.kind}
                name={deploymentData.name}
                namespace={namespace}
              />
            </div>
            <div className="col-sm-4 col-xs-3">
              <div className="odc-revision-deployment-list__pod">
                <PodStatus
                  standalone
                  data={current ? current.pods : []}
                  size={25}
                  innerRadius={8}
                  outerRadius={12}
                  title={availableReplicas}
                  titleComponent={<ChartLabel style={{ fontSize: '10px' }} />}
                  showTooltip={false}
                />
              </div>
            </div>
          </div>
          {urls.length > 0 && (
            <div className="row">
              <div className="col-sm-12">
                <RoutesUrlLink urls={urls} />
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

export default RevisionsOverviewListItem;
