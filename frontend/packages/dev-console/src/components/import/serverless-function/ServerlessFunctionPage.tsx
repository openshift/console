import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { PageHeading } from '@console/internal/components/utils';
import { Title } from '@console/shared/src/components/title/Title';
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
          <Title>{t('devconsole~Create Serverless function')}</Title>
          <PageHeading title={t('devconsole~Create Serverless function')} />
          <AddServerlessFunction namespace={namespace} forApplication={application} />
        </NamespacedPage>
      )}
    </QueryFocusApplication>
  );
};

export default ServerlessFunctionPage;
