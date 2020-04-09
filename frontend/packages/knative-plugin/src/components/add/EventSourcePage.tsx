import * as React from 'react';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { PageHeading, Firehose } from '@console/internal/components/utils';
import { ProjectModel } from '@console/internal/models';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import EventSource from './EventSource';

type EventSourcePageProps = RouteComponentProps<{ ns?: string }>;

const EventSourcePage: React.FC<EventSourcePageProps> = ({ match, location }) => {
  const namespace = match.params.ns;
  const searchParams = new URLSearchParams(location.search);
  const resources = [{ kind: ProjectModel.kind, prop: ProjectModel.id, isList: true }];
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>Event Sources</title>
      </Helmet>
      <PageHeading title="Event Sources" />
      <div className="co-m-pane__body">
        <Firehose resources={resources}>
          <EventSource
            namespace={namespace}
            selectedApplication={searchParams.get(QUERY_PROPERTIES.APPLICATION)}
            contextSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
          />
        </Firehose>
      </div>
    </NamespacedPage>
  );
};

export default EventSourcePage;
