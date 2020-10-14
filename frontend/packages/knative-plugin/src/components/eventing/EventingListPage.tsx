import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import { Page } from '@console/internal/components/utils';
import { NamespaceBar } from '@console/internal/components/namespace';
import { MenuActions, MultiTabListPage } from '@console/shared';
import EventSourceListPage from './eventsource-list/EventSourceListPage';
import { ServiceModel } from '../../models';

interface EventingListPageProps {
  match: Rmatch<{ ns: string }>;
}

const EventingListPage: React.FC<EventingListPageProps> = ({ match }) => {
  const {
    params: { ns: namespace },
  } = match;
  const [showTitle, canCreate] = [false, false];
  const menuActions: MenuActions = {
    service: { model: ServiceModel },
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
  ];

  return (
    <>
      <NamespaceBar />
      <MultiTabListPage pages={pages} match={match} title="Eventing" menuActions={menuActions} />
    </>
  );
};

export default EventingListPage;
