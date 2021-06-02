import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { referenceFor, K8sResourceKind } from '@console/internal/module/k8s';
import { OverviewItem } from '@console/shared';
import { EventingSubscriptionModel, EventingTriggerModel, EventingBrokerModel } from '../../models';
import { Subscriber } from '../../topology/topology-types';
import PubSubSubscribers from './EventPubSubSubscribers';
import EventTriggerFilterList from './EventTriggerFilterList';
import { FilterTableRowProps } from './FilterTable';

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
    ksservices?: K8sResourceKind[];
    filters?: FilterTableRowProps;
    subscribers?: Subscriber[];
  };
};

export const PubSubResourceOverviewList: React.FC<PubSubResourceOverviewListProps> = ({
  items,
  title,
}) => {
  const { t } = useTranslation();
  return (
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
        <span className="text-muted">
          {t('knative-plugin~No {{title}} found for this resource.', { title })}
        </span>
      )}
    </>
  );
};

const EventPubSubResources: React.FC<EventPubSubResourcesProps> = ({ item }) => {
  const { t } = useTranslation();
  const {
    obj,
    ksservices = [],
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
          <PubSubResourceOverviewList items={ksservices} title={t('knative-plugin~Subscriber')} />
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
          <PubSubResourceOverviewList items={ksservices} title={t('knative-plugin~Subscriber')} />
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
