import * as React from 'react';
import * as _ from 'lodash';
import { Button } from '@patternfly/react-core';
import { PodStatus } from '@console/shared';
import { ChartLabel } from '@patternfly/react-charts';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import {
  ResourceLink,
  SidebarSectionHeading,
  useAccessReview,
} from '@console/internal/components/utils';
import { RevisionModel } from '@console/knative-plugin';
import { setTrafficDistributionModal } from '../modals';
import { ServiceModel } from '../../models';
import './RevisionsOverviewList.scss';

export type RevisionsOverviewListProps = {
  revisions: K8sResourceKind[];
  service: K8sResourceKind;
};

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

const RevisionsOverviewList: React.FC<RevisionsOverviewListProps> = ({ revisions, service }) => {
  const canSetTrafficDistribution = useAccessReview({
    group: ServiceModel.apiGroup,
    resource: ServiceModel.plural,
    namespace: service.metadata.namespace,
    verb: 'update',
  });

  return (
    <>
      <SidebarSectionHeading text="Revisions" className="revision-overview-list">
        {/* add extra check, if sidebar is opened for a knative deployment */}
        {canSetTrafficDistribution &&
          (service.kind === ServiceModel.kind && (
            <Button
              variant="secondary"
              onClick={() => setTrafficDistributionModal({ obj: service })}
              isDisabled={!(revisions && revisions.length)}
            >
              Set Traffic Distribution
            </Button>
          ))}
      </SidebarSectionHeading>
      {_.isEmpty(revisions) ? (
        <span className="text-muted">No Revisions found for this resource.</span>
      ) : (
        <ul className="list-group">
          {_.map(revisions, (revision) => (
            <RevisionsOverviewListItem
              key={revision.metadata.uid}
              revision={revision}
              service={service}
            />
          ))}
        </ul>
      )}
    </>
  );
};

export default RevisionsOverviewList;
