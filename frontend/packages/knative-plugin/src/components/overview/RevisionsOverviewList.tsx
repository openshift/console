import * as React from 'react';
import * as _ from 'lodash';
import { ListGroup } from 'patternfly-react';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { RevisionModel } from '@console/knative-plugin';

export type RevisionsOverviewListProps = {
  revisions: K8sResourceKind[];
  service: K8sResourceKind;
};

export type RevisionsOverviewListItemProps = {
  revision: K8sResourceKind;
  service: K8sResourceKind;
};

const RevisionsOverviewListItem: React.FC<RevisionsOverviewListItemProps> = ({
  revision: {
    metadata: { name, namespace },
  },
  service: {
    status: { traffic },
  },
}) => {
  const getTraffic = (revision: string) => {
    if (!traffic || !traffic.length) {
      return null;
    }
    return `${_.get(_.find(traffic, { revisionName: revision }), 'percent', 0)}%`;
  };
  return (
    <li className="list-group-item">
      <div className="row">
        <div className="col-lg-8 col-md-8 col-sm-8">
          <ResourceLink kind={referenceForModel(RevisionModel)} name={name} namespace={namespace} />
        </div>
        <span className="col-lg-4 col-md-4 col-sm-4 text-right">{getTraffic(name)}</span>
      </div>
    </li>
  );
};

const RevisionsOverviewList: React.FC<RevisionsOverviewListProps> = ({ revisions, service }) => (
  <>
    <SidebarSectionHeading text="Revisions" />
    {_.isEmpty(revisions) ? (
      <span className="text-muted">No Revisions found for this resource.</span>
    ) : (
      <ListGroup componentClass="ul">
        {_.map(revisions, (revision) => (
          <RevisionsOverviewListItem
            key={revision.metadata.uid}
            revision={revision}
            service={service}
          />
        ))}
      </ListGroup>
    )}
  </>
);

export default RevisionsOverviewList;
