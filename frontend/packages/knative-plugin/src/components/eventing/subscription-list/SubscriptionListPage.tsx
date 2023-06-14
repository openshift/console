import * as React from 'react';
import { t } from 'i18next';
import Helmet from 'react-helmet';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventingSubscriptionModel } from '../../../models';
import SubscriptionList from './SubscriptionList';

const SubscriptionListPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  return (
    <>
      <Helmet>
        <title>{t('knative-plugin~Subscriptions')}</title>
      </Helmet>
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
