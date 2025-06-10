import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import {
  SUBSCRIBE_PROVIDER_API_VERSION_PARAM,
  SUBSCRIBE_PROVIDER_KIND_PARAM,
  SUBSCRIBE_PROVIDER_NAME_PARAM,
} from '../../../const';
import Subscribe from './Subscribe';

const SubscribePage: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const subscribeApiVersion = searchParams.get(SUBSCRIBE_PROVIDER_API_VERSION_PARAM);
  const subscribeKind = searchParams.get(SUBSCRIBE_PROVIDER_KIND_PARAM);
  const subscribeName = searchParams.get(SUBSCRIBE_PROVIDER_NAME_PARAM);

  const source: K8sResourceKind = {
    kind: subscribeKind,
    apiVersion: subscribeApiVersion,
    metadata: {
      namespace,
      name: subscribeName,
    },
  };

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <DocumentTitle>{t('knative-plugin~Subscribe')}</DocumentTitle>
      <PageHeading
        title={t('knative-plugin~Subscribe')}
        helpText={
          <>
            {t('knative-plugin~Subscribe to')} {subscribeApiVersion} {subscribeKind} {namespace}/
            {subscribeName}
          </>
        }
      />
      <Subscribe source={source} />
    </NamespacedPage>
  );
};

export default SubscribePage;
