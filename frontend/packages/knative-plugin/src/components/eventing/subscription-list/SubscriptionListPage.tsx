import * as React from 'react';
import { t } from 'i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { Title } from '@console/shared/src/components/title/Title';
import { EventingSubscriptionModel } from '../../../models';
import SubscriptionList from './SubscriptionList';

const SubscriptionListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  return (
    <>
      <Title>{t('knative-plugin~Subscriptions')}</Title>
      <ListPage
        canCreate={false}
        {...props}
        kind={referenceForModel(EventingSubscriptionModel)}
        ListComponent={SubscriptionList}
      />
    </>
  );
};

export default SubscriptionListPage;
