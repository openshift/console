import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { NamespacedPageVariants } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';
import NamespacedPage from '@console/shared/src/components/projects/NamespacedPage';
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
          'knative-plugin~Create an Event sink to receive incoming events from a particular source. Configure using YAML and form views.',
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
