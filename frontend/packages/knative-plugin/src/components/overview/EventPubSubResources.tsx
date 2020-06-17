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
  item: OverviewItem;
};

const PubSubResourceOverviewList: React.FC<PubSubResourceOverviewListProps> = ({
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
  const { obj } = item;
  const sinkServices = _.get(item, 'ksservices', []);
  const sinkSources = _.get(item, 'eventSources', []);
  const sinkSubscription = _.get(item, 'eventingsubscription', []);
  const sinkConnections = _.get(item, 'connections', []);
  switch (obj.kind) {
    case EventingSubscriptionModel.kind:
      return <PubSubResourceOverviewList items={sinkConnections} title="Connections" />;
    default:
      return (
        <>
          <PubSubResourceOverviewList items={sinkServices} title="Knative Service" />
          <PubSubResourceOverviewList items={sinkSources} title="Event Source" />
          <PubSubResourceOverviewList items={sinkSubscription} title="Subscription" />
        </>
      );
  }
};

export default EventPubSubResources;
