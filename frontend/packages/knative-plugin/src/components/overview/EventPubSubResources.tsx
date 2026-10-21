import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import type { OverviewItem } from '@console/shared';
import { EventingSubscriptionModel, EventingTriggerModel, EventingBrokerModel } from '../../models';
import type { Subscriber } from '../../topology/topology-types';
import PubSubSubscribers from './EventPubSubSubscribers';
import EventTriggerFilterList from './EventTriggerFilterList';
import type { FilterTableRowProps } from './FilterTable';

type PubSubResourceOverviewListProps = {
  items: K8sResourceKind[];
  title: string;
};

type EventPubSubResourcesProps = {
  item: OverviewItem & {
    triggers?: K8sResourceKind[];
    eventSources?: K8sResourceKind[];
    eventingsubscription?: K8sResourceKind[];
    pods?: K8sResourceKind[];
    deployments?: K8sResourceKind[];
    brokers?: K8sResourceKind[];
    channels?: K8sResourceKind[];
    subscriberRes?: K8sResourceKind[];
    filters?: FilterTableRowProps;
    subscribers?: Subscriber[];
  };
};

export const PubSubResourceOverviewList: FC<PubSubResourceOverviewListProps> = ({
  items,
  title,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <SidebarSectionHeading text={title} />
      {items?.length > 0 ? (
        <List isPlain isBordered>
          {_.map(items, (itemData) => (
            <ListItem key={itemData.metadata.uid}>
              <ResourceLink
                kind={referenceFor(itemData)}
                name={itemData.metadata?.name}
                namespace={itemData.metadata?.namespace}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <span className="pf-v6-u-text-color-subtle">
          {t('knative-plugin~No {{title}} found for this resource.', { title })}
        </span>
      )}
    </>
  );
};

const EventPubSubResources: FC<EventPubSubResourcesProps> = ({ item }) => {
  const { t } = useTranslation();
  const {
    obj,
    subscriberRes = [],
    eventSources = [],
    pods = [],
    deployments = [],
    brokers = [],
    channels = [],
    filters = [],
    subscribers = [],
  } = item;

  switch (obj.kind) {
    case EventingTriggerModel.kind:
      return (
        <>
          <PubSubResourceOverviewList
            items={eventSources}
            title={t('knative-plugin~Event Sources')}
          />
          <PubSubResourceOverviewList items={brokers} title={t('knative-plugin~Broker')} />
          <PubSubResourceOverviewList
            items={subscriberRes}
            title={t('knative-plugin~Subscriber')}
          />
          <EventTriggerFilterList filters={filters} />
        </>
      );
    case EventingSubscriptionModel.kind:
      return (
        <>
          <PubSubResourceOverviewList
            items={eventSources}
            title={t('knative-plugin~Event Sources')}
          />
          <PubSubResourceOverviewList items={channels} title={t('knative-plugin~Channel')} />
          <PubSubResourceOverviewList
            items={subscriberRes}
            title={t('knative-plugin~Subscriber')}
          />
        </>
      );
    case EventingBrokerModel.kind:
      return (
        <>
          <PubSubResourceOverviewList
            items={eventSources}
            title={t('knative-plugin~Event Sources')}
          />
          <PubSubSubscribers subscribers={subscribers} />
          <PubSubResourceOverviewList items={pods} title={t('knative-plugin~Pods')} />
          <PubSubResourceOverviewList items={deployments} title={t('knative-plugin~Deployments')} />
        </>
      );
    default:
      return (
        <>
          <PubSubResourceOverviewList
            items={eventSources}
            title={t('knative-plugin~Event Sources')}
          />
          <PubSubSubscribers subscribers={subscribers} />
          {channels?.length > 0 && (
            <PubSubResourceOverviewList items={channels} title={t('knative-plugin~Channel')} />
          )}
        </>
      );
  }
};

export default EventPubSubResources;
