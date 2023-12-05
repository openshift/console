import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { PageHeading, Firehose } from '@console/internal/components/utils';
import { QUERY_PROPERTIES } from '../../const';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import QueryFocusApplication from '../QueryFocusApplication';
import DeployImage from './DeployImage';

const DeployImagePage: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('devconsole~Deploy Image')}</title>
      </Helmet>
      <PageHeading title={t('devconsole~Deploy Image')} />
      <QueryFocusApplication>
        {(desiredApplication) => (
          <Firehose resources={[{ kind: 'Project', prop: 'projects', isList: true }]}>
            <DeployImage
              forApplication={desiredApplication}
              namespace={namespace}
              contextualSource={params.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
            />
          </Firehose>
        )}
      </QueryFocusApplication>
    </NamespacedPage>
  );
};

export default DeployImagePage;
