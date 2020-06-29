import * as React from 'react';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { PageBody, getBadgeFromType } from '@console/shared';
import { PageHeading } from '@console/internal/components/utils';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import ConnectedEventSource from './EventSource';
import { KnativeEventingModel } from '../../models';
import EventSourceAlert from './EventSourceAlert';
import { useEventSourceList } from '../../utils/create-eventsources-utils';

type EventSourcePageProps = RouteComponentProps<{ ns?: string }>;

const EventSourcePage: React.FC<EventSourcePageProps> = ({ match, location }) => {
  const namespace = match.params.ns;
  const eventSourceStatus = useEventSourceList(namespace);
  const searchParams = new URLSearchParams(location.search);
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>Event Sources</title>
      </Helmet>
      <PageHeading badge={getBadgeFromType(KnativeEventingModel.badge)} title="Event Sources">
        Create an event source to register interest in a class of events from a particular system
      </PageHeading>
      <PageBody flexLayout>
        <EventSourceAlert namespace={namespace} eventSourceStatus={eventSourceStatus} />
        <ConnectedEventSource
          namespace={namespace}
          eventSourceStatus={eventSourceStatus}
          selectedApplication={searchParams.get(QUERY_PROPERTIES.APPLICATION)}
          contextSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
        />
      </PageBody>
    </NamespacedPage>
  );
};

export default EventSourcePage;
