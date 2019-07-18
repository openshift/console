import * as React from 'react';
import * as _ from 'lodash';
import { ListGroup } from 'patternfly-react';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
import { RevisionModel } from '@console/knative-plugin';

export type RevisionsOverviewListProps = {
  revisions: K8sResourceKind[];
};

export type RevisionsOverviewListItemProps = {
  revision: K8sResourceKind;
};

const RevisionsOverviewListItem: React.FC<RevisionsOverviewListItemProps> = ({
  revision: {
    metadata: { name, namespace },
  },
}) => {
  return (
    <li className="list-group-item">
      <ResourceLink kind={referenceForModel(RevisionModel)} name={name} namespace={namespace} />
    </li>
  );
};

const RevisionsOverviewList: React.FC<RevisionsOverviewListProps> = ({ revisions }) => (
  <ListGroup componentClass="ul">
    {_.map(revisions, (revision) => (
      <RevisionsOverviewListItem key={revision.metadata.uid} revision={revision} />
    ))}
  </ListGroup>
);

export default RevisionsOverviewList;
