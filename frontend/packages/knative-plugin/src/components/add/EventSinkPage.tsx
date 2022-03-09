import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';
import { useEventSinkStatus } from '../../hooks/useEventSinkStatus';
import EventSink from './EventSink';
import EventSinkAlert from './EventSinkAlert';

type EventSinkPageProps = RouteComponentProps<{ ns?: string }>;

const EventSinkPage: React.FC<EventSinkPageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const searchParams = new URLSearchParams(location.search);
  const sinkKindProp = searchParams.get('sinkKind');
  const kameletName = sinkKindProp && searchParams.get('name');
  const {
    isValidSink,
    createSinkAccessLoading,
    createSinkAccess,
    loaded,
    normalizedSink,
    kamelet,
  } = useEventSinkStatus(namespace, sinkKindProp, kameletName);

  if (!loaded) {
    return <LoadingBox />;
  }

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('knative-plugin~Event Sink')}</title>
      </Helmet>
      <PageHeading title={t('knative-plugin~Create Event Sink')}>
        {t(
          'knative-plugin~Create an Event sink to register interest in a class of events from a particular system. Configure using the YAML and form views.',
        )}
      </PageHeading>
      {loaded && isValidSink && !createSinkAccessLoading && createSinkAccess ? (
        <EventSink
          namespace={namespace}
          normalizedSink={normalizedSink}
          selectedApplication={searchParams.get(QUERY_PROPERTIES.APPLICATION)}
          contextSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
          kameletSink={kamelet}
        />
      ) : (
        <EventSinkAlert
          isValidSink={isValidSink}
          createSinkAccessLoading={createSinkAccessLoading}
          createSinkAccess={createSinkAccess}
        />
      )}
    </NamespacedPage>
  );
};

export default EventSinkPage;
