import * as React from 'react';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PageBody, TechPreviewBadge } from '@console/shared';
import { LoadingInline, PageHeading } from '@console/internal/components/utils';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import ConnectedEventSource from './EventSource';
import EventSourceAlert from './EventSourceAlert';
import { CamelKameletBindingModel } from '../../models';
import { useEventSourceStatus } from '../../hooks';

type EventSourcePageProps = RouteComponentProps<{ ns?: string }>;

const EventSourcePage: React.FC<EventSourcePageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
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
      <Helmet>
        <title>{t('knative-plugin~Event Source')}</title>
      </Helmet>
      <PageHeading
        title={t('knative-plugin~Create Event Source')}
        badge={isKameletSource ? <TechPreviewBadge /> : null}
      >
        {t(
          'knative-plugin~Create an Event source to register interest in a class of events from a particular system. Configure using the YAML and form views.',
        )}
      </PageHeading>
      <PageBody flexLayout>
        {loaded ? (
          <EventSourceAlert
            isValidSource={isValidSource}
            createSourceAccessLoading={createSourceAccessLoading}
            createSourceAccess={createSourceAccess}
          />
        ) : (
          <LoadingInline />
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
      </PageBody>
    </NamespacedPage>
  );
};

export default EventSourcePage;
