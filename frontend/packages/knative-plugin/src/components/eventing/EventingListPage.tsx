import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import { Page } from '@console/internal/components/utils';
import { isCatalogTypeEnabled, MenuActions, MultiTabListPage } from '@console/shared';
import { EVENT_SOURCE_CATALOG_TYPE_ID } from '../../const';
import { EventingBrokerModel } from '../../models';
import BrokerListPage from './brokers-list/BrokerListPage';
import ChannelListPage from './channels-list/ChannelListPage';
import EventSourceListPage from './eventsource-list/EventSourceListPage';
import SubscriptionListPage from './subscription-list/SubscriptionListPage';
import TriggerListPage from './triggers-list/TriggerListPage';

const EventingListPage: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const [showTitle, canCreate] = [false, false];
  const nsSelected = namespace || 'default';
  const isEventSourceTypeEnabled = isCatalogTypeEnabled(EVENT_SOURCE_CATALOG_TYPE_ID);
  const menuActions: MenuActions = {
    eventSource: {
      label: isEventSourceTypeEnabled ? t('knative-plugin~Event Source') : null,
      onSelection: () => `/catalog/ns/${nsSelected}?catalogType=EventSource&provider=["Red+Hat"]`,
    },
    brokers: {
      label: t('knative-plugin~Broker'),
      model: EventingBrokerModel,
      onSelection: () => `/broker/ns/${nsSelected}`,
    },
    channels: {
      label: t('knative-plugin~Channel'),
      onSelection: () => `/channel/ns/${nsSelected}`,
    },
  };
  const pages: Page[] = [
    {
      href: '',
      // t('knative-plugin~Event Sources')
      nameKey: 'knative-plugin~Event Sources',
      component: EventSourceListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'brokers',
      // t('knative-plugin~Brokers')
      nameKey: 'knative-plugin~Brokers',
      component: BrokerListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'triggers',
      // t('knative-plugin~Triggers')
      nameKey: 'knative-plugin~Triggers',
      component: TriggerListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'channels',
      // t('knative-plugin~Channels')
      nameKey: 'knative-plugin~Channels',
      component: ChannelListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'subscriptions',
      // t('knative-plugin~Subscriptions')
      nameKey: 'knative-plugin~Subscriptions',
      component: SubscriptionListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
  ];

  return (
    <>
      <NamespaceBar />
      <MultiTabListPage
        pages={pages}
        title={t('knative-plugin~Eventing')}
        menuActions={menuActions}
        telemetryPrefix="Eventing"
      />
    </>
  );
};

export default EventingListPage;
