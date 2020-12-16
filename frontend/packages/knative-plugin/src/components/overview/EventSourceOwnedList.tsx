import * as React from 'react';
import { SidebarSectionHeading, ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';

type EventSourceOwnedListProps = {
  source: K8sResourceKind;
};

const EventSourceOwnedList: React.FC<EventSourceOwnedListProps> = ({ source }) => {
  const sourceModel = modelFor(referenceFor(source));
  return (
    <>
      <SidebarSectionHeading text={sourceModel?.label ?? source.kind} />
      <ul className="list-group">
        <li className="list-group-item">
          <ResourceLink
            kind={referenceFor(source)}
            name={source.metadata?.name}
            namespace={source.metadata?.namespace}
          />
        </li>
      </ul>
    </>
  );
};

export default EventSourceOwnedList;
