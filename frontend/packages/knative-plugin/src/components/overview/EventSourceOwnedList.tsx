import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { SidebarSectionHeading, ResourceLink } from '@console/internal/components/utils';
import { K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';

type EventSourceOwnedListProps = {
  source: K8sResourceKind;
};

const EventSourceOwnedList: FC<EventSourceOwnedListProps> = ({ source }) => {
  const sourceModel = modelFor(referenceFor(source));
  return (
    <>
      <SidebarSectionHeading text={sourceModel?.label ?? source.kind} />
      <List isPlain isBordered>
        <ListItem>
          <ResourceLink
            kind={referenceFor(source)}
            name={source.metadata?.name}
            namespace={source.metadata?.namespace}
          />
        </ListItem>
      </List>
    </>
  );
};

export default EventSourceOwnedList;
