import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import { Page } from '@console/internal/components/utils';
import { NamespaceBar } from '@console/internal/components/namespace';
import { MenuActions, MultiTabListPage } from '@console/shared';
import EventSourceListPage from './eventsource-list/EventSourceListPage';
import BrokerListPage from './brokers-list/BrokerListPage';
import ChannelListPage from './channels-list/ChannelListPage';

interface EventingListPageProps {
  match: Rmatch<{ ns: string }>;
}

const EventingListPage: React.FC<EventingListPageProps> = ({ match }) => {
  const {
    params: { ns: namespace },
  } = match;
  const [showTitle, canCreate] = [false, false];
  const menuActions: MenuActions = {
    eventSource: { label: 'Event Source', onSelection: () => `/event-source/ns/${namespace}` },
    channels: { label: 'Channel', onSelection: () => `/channel/ns/${namespace}` },
  };
  const pages: Page[] = [
    {
      href: '',
      name: 'Event Sources',
      component: EventSourceListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'brokers',
      name: 'Brokers',
      component: BrokerListPage,
      pageData: {
        canCreate,
        namespace,
        showTitle,
      },
    },
    {
      href: 'channels',
      name: 'Channels',
      component: ChannelListPage,
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
      <MultiTabListPage pages={pages} match={match} title="Eventing" menuActions={menuActions} />
    </>
  );
};

export default EventingListPage;
