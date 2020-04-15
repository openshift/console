import * as React from 'react';
import * as _ from 'lodash';
import { PodStatus } from '@console/shared';
import { ChartLabel } from '@patternfly/react-charts';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
import { RevisionModel } from '../../models';
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
  const {
    status: { traffic },
  } = service;
  const getTraffic = (revName: string) => {
    if (!traffic || !traffic.length) {
      return null;
    }
    const trafficPercent = _.get(_.find(traffic, { revisionName: revName }), 'percent', null);
    return trafficPercent ? `${trafficPercent}%` : null;
  };
  const deploymentData = _.get(revision, 'resources.current.obj.metadata.ownerReferences[0]', {});
  const current = _.get(revision, 'resources.current', null);
  const availableReplicas = _.get(revision, 'resources.current.obj.status.availableReplicas', '0');
  return (
    <li className="list-group-item">
      <div className="row">
        <div className="col-sm-8 col-xs-9">
          <ResourceLink kind={referenceForModel(RevisionModel)} name={name} namespace={namespace} />
        </div>
        <span className="col-sm-4 col-xs-3 text-right">{getTraffic(name)}</span>
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
        </div>
      )}
    </li>
  );
};

export default RevisionsOverviewListItem;
