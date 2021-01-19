import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Page } from '@console/internal/components/utils';
import { NamespaceBar } from '@console/internal/components/namespace';
import { MenuActions, MultiTabListPage } from '@console/shared';
import EventSourceListPage from './eventsource-list/EventSourceListPage';
import BrokerListPage from './brokers-list/BrokerListPage';
import ChannelListPage from './channels-list/ChannelListPage';
import TriggerListPage from './triggers-list/TriggerListPage';
import SubscriptionListPage from './subscription-list/SubscriptionListPage';
import { EventingBrokerModel } from '../../models';

interface EventingListPageProps {
  match: Rmatch<{ ns: string }>;
}

const EventingListPage: React.FC<EventingListPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const {
    params: { ns: namespace },
  } = match;
  const [showTitle, canCreate] = [false, false];
  const menuActions: MenuActions = {
    eventSource: {
      label: t('knative-plugin~Event Source'),
      onSelection: () => `/catalog/ns/${namespace}?catalogType=EventSource`,
    },
    brokers: { label: t('knative-plugin~Broker'), model: EventingBrokerModel },
    channels: { label: t('knative-plugin~Channel'), onSelection: () => `/channel/ns/${namespace}` },
  };
  const pages: Page[] = [
    {
      href: '',
      name: t('knative-plugin~Event Sources'),
      component: EventSourceListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'brokers',
      name: t('knative-plugin~Brokers'),
      component: BrokerListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'triggers',
      name: t('knative-plugin~Triggers'),
      component: TriggerListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'channels',
      name: t('knative-plugin~Channels'),
      component: ChannelListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'subscriptions',
      name: t('knative-plugin~Subscriptions'),
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
        match={match}
        title={t('knative-plugin~Eventing')}
        menuActions={menuActions}
      />
    </>
  );
};

export default EventingListPage;
