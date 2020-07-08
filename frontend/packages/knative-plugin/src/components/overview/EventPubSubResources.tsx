import * as React from 'react';
import * as _ from 'lodash';
import { OverviewItem } from '@console/shared';
import { referenceFor, K8sResourceKind } from '@console/internal/module/k8s';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { EventingSubscriptionModel, EventingTriggerModel, EventingBrokerModel } from '../../models';

type PubSubResourceOverviewListProps = {
  items: K8sResourceKind[];
  title: string;
};

type EventPubSubResourcesProps = {
  item: OverviewItem & {
    triggers?: K8sResourceKind[];
    eventSources?: K8sResourceKind[];
    eventingsubscription?: K8sResourceKind[];
    connections?: K8sResourceKind[];
    pods?: K8sResourceKind[];
    deployments?: K8sResourceKind[];
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
    triggers = [],
    connections = [],
    pods = [],
    deployments = [],
  } = item;

  switch (obj.kind) {
    case EventingTriggerModel.kind:
    case EventingSubscriptionModel.kind:
      return <PubSubResourceOverviewList items={connections} title="Connections" />;
    case EventingBrokerModel.kind:
      return (
        <>
          <PubSubResourceOverviewList items={ksservices} title="Knative Services" />
          <PubSubResourceOverviewList items={eventSources} title="Event Sources" />
          <PubSubResourceOverviewList items={triggers} title="Triggers" />
          <PubSubResourceOverviewList items={pods} title="Pods" />
          <PubSubResourceOverviewList items={deployments} title="Deployments" />
        </>
      );
    default:
      return (
        <>
          <PubSubResourceOverviewList items={ksservices} title="Knative Services" />
          <PubSubResourceOverviewList items={eventSources} title="Event Sources" />
          <PubSubResourceOverviewList items={eventingsubscription} title="Subscriptions" />
        </>
      );
  }
};

export default EventPubSubResources;
