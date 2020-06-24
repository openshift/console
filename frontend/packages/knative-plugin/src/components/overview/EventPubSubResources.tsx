import * as React from 'react';
import * as _ from 'lodash';
import { OverviewItem } from '@console/shared';
import { referenceFor, K8sResourceKind } from '@console/internal/module/k8s';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { EventingSubscriptionModel } from '../../models';

type PubSubResourceOverviewListProps = {
  items: K8sResourceKind[];
  title: string;
};

type EventPubSubResourcesProps = {
  item: OverviewItem & {
    eventSources?: K8sResourceKind[];
    eventingsubscription?: K8sResourceKind[];
    connections?: K8sResourceKind[];
  };
};

export const PubSubResourceOverviewList: React.FC<PubSubResourceOverviewListProps> = ({
  items,
  title,
}) => (
  <>
    <SidebarSectionHeading text={title} />
    {items?.length > 0 ? (
      <ul className="list-group">
        {_.map(items, (itemData) => (
          <li className="list-group-item" key={itemData.metadata.uid}>
            <ResourceLink
              kind={referenceFor(itemData)}
              name={itemData.metadata?.name}
              namespace={itemData.metadata?.namespace}
            />
          </li>
        ))}
      </ul>
    ) : (
      <span className="text-muted">No {title} found for this resource.</span>
    )}
  </>
);

const EventPubSubResources: React.FC<EventPubSubResourcesProps> = ({ item }) => {
  const {
    obj,
    ksservices = [],
    eventSources = [],
    eventingsubscription = [],
    connections = [],
  } = item;

  switch (obj.kind) {
    case EventingSubscriptionModel.kind:
      return <PubSubResourceOverviewList items={connections} title="Connections" />;
    default:
      return (
        <>
          <PubSubResourceOverviewList items={ksservices} title="Knative Service" />
          <PubSubResourceOverviewList items={eventSources} title="Event Source" />
          <PubSubResourceOverviewList items={eventingsubscription} title="Subscription" />
        </>
      );
  }
};

export default EventPubSubResources;
