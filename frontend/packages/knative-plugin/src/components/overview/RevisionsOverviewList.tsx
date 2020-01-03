import * as React from 'react';
import * as _ from 'lodash';
import { Button } from '@patternfly/react-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { SidebarSectionHeading, useAccessReview } from '@console/internal/components/utils';
import { setTrafficDistributionModal } from '../modals';
import { ServiceModel } from '../../models';
import RevisionsOverviewListItem from './RevisionsOverviewListItem';
import './RevisionsOverviewList.scss';

export type RevisionsOverviewListProps = {
  revisions: K8sResourceKind[];
  service: K8sResourceKind;
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
        {canSetTrafficDistribution && (
          <Button
            variant="secondary"
            onClick={() => setTrafficDistributionModal({ obj: service })}
            isDisabled={!(revisions && revisions.length)}
          >
            Set Traffic Distribution
          </Button>
        )}
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
