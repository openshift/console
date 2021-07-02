import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import QueryFocusApplication from '@console/dev-console/src/components/QueryFocusApplication';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { PageHeading } from '@console/internal/components/utils';
import AddBroker from './brokers/AddBroker';

type EventingBrokerPageProps = RouteComponentProps<{ ns?: string }>;

const EventingBrokerPage: React.FC<EventingBrokerPageProps> = ({ match, location }) => {
  const namespace = match.params.ns;
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(location.search);
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('knative-plugin~Broker')}</title>
      </Helmet>
      <PageHeading title={t('knative-plugin~Broker')}>
        {t(
          'knative-plugin~Create a Knative Broker to create an event forwarding and persistence layer with in-memory and reliable implementations',
        )}
      </PageHeading>
      <QueryFocusApplication>
        {(selectedApplication) => (
          <AddBroker
            namespace={namespace}
            selectedApplication={selectedApplication}
            contextSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
          />
        )}
      </QueryFocusApplication>
    </NamespacedPage>
  );
};

export default EventingBrokerPage;
