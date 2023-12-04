import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { PageHeading } from '@console/internal/components/utils';
import { useChannelList } from '../../utils/create-channel-utils';
import AddChannel from './channels/AddChannel';

const EventingChannelPage: React.FC = () => {
  const { ns: namespace } = useParams();
  const location = useLocation();
  const channels = useChannelList(namespace);
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(location.search);
  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('knative-plugin~Channel')}</title>
      </Helmet>
      <PageHeading title={t('knative-plugin~Channel')}>
        {t(
          'knative-plugin~Create a Knative Channel to create an event forwarding and persistence layer with in-memory and reliable implementations',
        )}
      </PageHeading>
      <AddChannel
        namespace={namespace}
        channels={channels}
        selectedApplication={searchParams.get(QUERY_PROPERTIES.APPLICATION)}
        contextSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
      />
    </NamespacedPage>
  );
};

export default EventingChannelPage;
