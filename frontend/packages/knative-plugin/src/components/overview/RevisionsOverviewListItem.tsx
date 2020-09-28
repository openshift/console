import * as React from 'react';
import * as _ from 'lodash';
import { PodStatus } from '@console/shared';
import { ChartLabel } from '@patternfly/react-charts';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
import { Traffic } from '../../types';
import { RevisionModel } from '../../models';
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
  const {
    status: { traffic },
  } = service;
  const getTrafficByRevision = (revName: string) => {
    if (!traffic || !traffic.length) {
      return {};
    }
    const trafficPercent = traffic
      .filter((t: Traffic) => t.revisionName === revName)
      .reduce(
        (acc, tr: Traffic) => {
          acc.percent += tr.percent ? tr.percent : 0;
          if (tr.url) {
            acc.urls.push(tr.url);
          }
          return acc;
        },
        { urls: [], percent: 0 },
      );
    return {
      ...trafficPercent,
      percent: trafficPercent.percent ? `${trafficPercent.percent}%` : null,
    };
  };
  const deploymentData = _.get(revision, 'resources.current.obj.metadata.ownerReferences[0]', {});
  const current = _.get(revision, 'resources.current', null);
  const availableReplicas = _.get(revision, 'resources.current.obj.status.availableReplicas', '0');
  const { urls = [], percent: trafficPercent } = getTrafficByRevision(name);
  return (
    <li className="list-group-item">
      <div className="row">
        <div className="col-sm-8 col-xs-9">
          <ResourceLink kind={referenceForModel(RevisionModel)} name={name} namespace={namespace} />
        </div>
        <span className="col-sm-4 col-xs-3 text-right">{trafficPercent}</span>
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
