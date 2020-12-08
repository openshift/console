import * as React from 'react';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PageBody } from '@console/shared';
import { LoadingInline, PageHeading } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import ConnectedEventSource from './EventSource';
import EventSourceAlert from './EventSourceAlert';
import {
  addCamelKameletSourceList,
  useEventSourceList,
} from '../../utils/create-eventsources-utils';
import { isDynamicEventSourceKind } from '../../utils/fetch-dynamic-eventsources-utils';
import { CamelKameletBindingModel, CamelKameletModel } from '../../models';

type EventSourcePageProps = RouteComponentProps<{ ns?: string }>;

const EventSourcePage: React.FC<EventSourcePageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const eventSourceList = useEventSourceList(namespace);
  const searchParams = new URLSearchParams(location.search);
  const sourceKindProp = searchParams.get('sourceKind');
  const kameletName = sourceKindProp && searchParams.get('name');
  const [kamelet, kameletLoaded, kameletLoadError] = useK8sGet<K8sResourceKind>(
    CamelKameletModel,
    kameletName,
    namespace,
  );
  const isKameletSource = kameletName && sourceKindProp === CamelKameletBindingModel.kind;
  const isSourceKindPresent =
    (sourceKindProp && isDynamicEventSourceKind(sourceKindProp)) || isKameletSource;
  const eventSourceStatus = isKameletSource
    ? addCamelKameletSourceList(eventSourceList, kamelet, kameletLoaded, kameletLoadError)
    : eventSourceList;
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('knative-plugin~Event Source')}</title>
      </Helmet>
      <PageHeading title={t('knative-plugin~Create Event Source')}>
        {t(
          'knative-plugin~Create an Event source to register interest in a class of events from a particular system. Configure using the YAML and form views.',
        )}
      </PageHeading>
      <PageBody flexLayout>
        <EventSourceAlert
          eventSourceStatus={eventSourceStatus}
          showSourceKindAlert={!isSourceKindPresent || (isKameletSource && kameletLoadError)}
        />
        {eventSourceStatus?.loaded ? (
          <ConnectedEventSource
            namespace={namespace}
            eventSourceStatus={eventSourceStatus}
            selectedApplication={searchParams.get(QUERY_PROPERTIES.APPLICATION)}
            contextSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
            sourceKind={searchParams.get('sourceKind')}
            kameletSource={isKameletSource && kamelet}
          />
        ) : (
          <LoadingInline />
        )}
      </PageBody>
    </NamespacedPage>
  );
};

export default EventSourcePage;
