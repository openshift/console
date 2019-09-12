import * as React from 'react';
import * as _ from 'lodash';
import { ListGroup } from 'patternfly-react';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
import { RevisionModelAlpha, RevisionModelBeta } from '@console/knative-plugin';

export type RevisionsOverviewListProps = {
  revisions: K8sResourceKind[];
};

export type RevisionsOverviewListItemProps = {
  revision: K8sResourceKind;
};

const RevisionsOverviewListItemAlpha: React.FC<RevisionsOverviewListItemProps> = ({
  revision: {
    metadata: { name, namespace },
  },
}) => {
  return (
    <li className="list-group-item">
      <ResourceLink
        kind={referenceForModel(RevisionModelAlpha)}
        name={name}
        namespace={namespace}
      />
    </li>
  );
};

export const RevisionsOverviewListAlpha: React.FC<RevisionsOverviewListProps> = ({ revisions }) => (
  <ListGroup componentClass="ul">
    {_.map(revisions, (revision) => (
      <RevisionsOverviewListItemAlpha key={revision.metadata.uid} revision={revision} />
    ))}
  </ListGroup>
);

const RevisionsOverviewListItemBeta: React.FC<RevisionsOverviewListItemProps> = ({
  revision: {
    metadata: { name, namespace },
  },
}) => {
  return (
    <li className="list-group-item">
      <ResourceLink kind={referenceForModel(RevisionModelBeta)} name={name} namespace={namespace} />
    </li>
  );
};

export const RevisionsOverviewListBeta: React.FC<RevisionsOverviewListProps> = ({ revisions }) => (
  <ListGroup componentClass="ul">
    {_.map(revisions, (revision) => (
      <RevisionsOverviewListItemBeta key={revision.metadata.uid} revision={revision} />
    ))}
  </ListGroup>
);
