import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { Title } from '@console/shared/src/components/title/Title';
import { EventingBrokerModel } from '../../../models';
import BrokerList from './BrokerList';

const BrokerListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Title>{t('knative-plugin~Brokers')}</Title>
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
