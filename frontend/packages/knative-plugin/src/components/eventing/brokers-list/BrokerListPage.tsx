import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingBrokerModel } from '../../../models';
import BrokerList from './BrokerList';

const BrokerListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('knative-plugin~Brokers')}</title>
      </Helmet>
      <ListPage
        canCreate={false}
        {...props}
        kind={referenceForModel(EventingBrokerModel)}
        ListComponent={BrokerList}
      />
    </>
  );
};

export default BrokerListPage;
