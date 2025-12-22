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
import { useEventSourceStatus } from '../../hooks';
import { CamelKameletBindingModel } from '../../models';
import ConnectedEventSource from './EventSource';
import EventSourceAlert from './EventSourceAlert';

const EventSourcePage: FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sourceKindProp = searchParams.get('sourceKind');
  const kameletName = sourceKindProp && searchParams.get('name');
  const isKameletSource = kameletName && sourceKindProp === CamelKameletBindingModel.kind;
  const {
    isValidSource,
    createSourceAccessLoading,
    createSourceAccess,
    loaded,
    normalizedSource,
    kamelet,
  } = useEventSourceStatus(namespace, sourceKindProp, kameletName);

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <DocumentTitle>{t('knative-plugin~Event Source')}</DocumentTitle>
      <PageHeading
        title={t('knative-plugin~Create Event Source')}
        helpText={t(
          'knative-plugin~Create an Event source to register interest in a class of events from a particular system. Configure using YAML and form views.',
        )}
      />

      {loaded ? (
        <EventSourceAlert
          isValidSource={isValidSource}
          createSourceAccessLoading={createSourceAccessLoading}
          createSourceAccess={createSourceAccess}
        />
      ) : (
        <LoadingBox />
      )}
      {loaded && isValidSource && !createSourceAccessLoading && createSourceAccess && (
        <ConnectedEventSource
          namespace={namespace}
          normalizedSource={normalizedSource}
          selectedApplication={searchParams.get(QUERY_PROPERTIES.APPLICATION)}
          contextSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
          sourceKind={sourceKindProp}
          kameletSource={isKameletSource && kamelet}
        />
      )}
    </NamespacedPage>
  );
};

export default EventSourcePage;
