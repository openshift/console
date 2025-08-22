import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
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
          <DocumentTitle>{t('devconsole~Create Serverless function')}</DocumentTitle>
          <PageHeading title={t('devconsole~Create Serverless function')} />
          <AddServerlessFunction namespace={namespace} forApplication={application} />
        </NamespacedPage>
      )}
    </QueryFocusApplication>
  );
};

export default ServerlessFunctionPage;
