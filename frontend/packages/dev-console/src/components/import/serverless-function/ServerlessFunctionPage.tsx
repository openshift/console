import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { PageHeading } from '@console/internal/components/utils';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import QueryFocusApplication from '../../QueryFocusApplication';
import AddServerlessFunction from './AddServerlessFunction';

const ServerlessFunctionPage: React.FC = () => {
  const { ns: namespace } = useParams();
  const { t } = useTranslation();
  return (
    <QueryFocusApplication>
      {(application) => (
        <NamespacedPage disabled variant={NamespacedPageVariants.light}>
          <Helmet>
            <title>{t('devconsole~Create Serverless function')}</title>
          </Helmet>
          <PageHeading title={t('devconsole~Create Serverless function')} />
          <AddServerlessFunction namespace={namespace} forApplication={application} />
        </NamespacedPage>
      )}
    </QueryFocusApplication>
  );
};

export default ServerlessFunctionPage;
