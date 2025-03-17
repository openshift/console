import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import QueryFocusApplication from '@console/dev-console/src/components/QueryFocusApplication';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { PageHeading } from '@console/internal/components/utils';
import { Title } from '@console/shared/src/components/title/Title';
import AddBroker from './brokers/AddBroker';

const EventingBrokerPage: React.FC = () => {
  const { ns: namespace } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(location.search);
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Title>{t('knative-plugin~Broker')}</Title>
      <PageHeading title={t('knative-plugin~Broker')}>
        {t(
          'knative-plugin~Create a Broker to define an event mesh for collecting a pool of events and route those events based on attributes, through triggers',
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
