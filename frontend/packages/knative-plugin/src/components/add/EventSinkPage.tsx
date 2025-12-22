import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { LoadingBox } from '@console/internal/components/utils';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { useEventSinkStatus } from '../../hooks/useEventSinkStatus';
import EventSink from './EventSink';
import EventSinkAlert from './EventSinkAlert';

const EventSinkPage: FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const location = useLocation();
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
      <DocumentTitle>{t('knative-plugin~Event Sink')}</DocumentTitle>
      <PageHeading
        title={t('knative-plugin~Create Event Sink')}
        helpText={t(
          'knative-plugin~Create an Event sink to receive incoming events from a particular source. Configure using YAML and form views.',
        )}
      />
      {loaded && isValidSink && !createSinkAccessLoading && createSinkAccess ? (
        <EventSink
          namespace={namespace}
          normalizedSink={normalizedSink}
          selectedApplication={searchParams.get(QUERY_PROPERTIES.APPLICATION)}
          contextSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
          sinkKind={sinkKindProp}
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
