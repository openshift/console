import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import QueryFocusApplication from '@console/dev-console/src/components/QueryFocusApplication';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import AddBroker from './brokers/AddBroker';

const EventingBrokerPage: React.FC = () => {
  const { ns: namespace } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(location.search);
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <DocumentTitle>{t('knative-plugin~Broker')}</DocumentTitle>
      <PageHeading
        title={t('knative-plugin~Broker')}
        helpText={t(
          'knative-plugin~Create a Broker to define an event mesh for collecting a pool of events and route those events based on attributes, through triggers',
        )}
      />
      <QueryFocusApplication>
        {(selectedApplication) => (
          <AddBroker
            namespace={namespace ?? ''}
            selectedApplication={selectedApplication ?? ''}
            contextSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE) ?? ''}
          />
        )}
      </QueryFocusApplication>
    </NamespacedPage>
  );
};

export default EventingBrokerPage;
