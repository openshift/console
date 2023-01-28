import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { PageHeading } from '@console/internal/components/utils';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import QueryFocusApplication from '../../QueryFocusApplication';
import AddServerlessFunction from './AddServerlessFunction';

type ServerlessFunctionPageProps = RouteComponentProps<{ ns?: string }>;

const ServerlessFunctionPage: React.FC<ServerlessFunctionPageProps> = ({ match }) => {
  const namespace = match.params.ns;
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
