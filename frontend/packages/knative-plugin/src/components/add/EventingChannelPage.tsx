import * as React from 'react';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { PageBody, getBadgeFromType } from '@console/shared';
import { PageHeading } from '@console/internal/components/utils';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { KnativeEventingModel } from '../../models';
import { useChannelList } from '../../utils/create-channel-utils';
import AddChannel from './channels/AddChannel';

type EventingChannelPageProps = RouteComponentProps<{ ns?: string }>;

const EventingChannelPage: React.FC<EventingChannelPageProps> = ({ match, location }) => {
  const namespace = match.params.ns;
  const channels = useChannelList(namespace);
  const searchParams = new URLSearchParams(location.search);
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>Channel</title>
      </Helmet>
      <PageHeading badge={getBadgeFromType(KnativeEventingModel.badge)} title="Channel">
        Create a Knative Channel to create an event forwarding and persistence layer with in-memory
        and reliable implementations
      </PageHeading>
      <PageBody flexLayout>
        <AddChannel
          namespace={namespace}
          channels={channels}
          selectedApplication={searchParams.get(QUERY_PROPERTIES.APPLICATION)}
          contextSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
        />
      </PageBody>
    </NamespacedPage>
  );
};

export default EventingChannelPage;
