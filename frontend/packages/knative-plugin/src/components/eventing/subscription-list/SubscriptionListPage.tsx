import type { ComponentProps, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { EventingSubscriptionModel } from '../../../models';
import SubscriptionList from './SubscriptionList';

const SubscriptionListPage: FC<ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <>
      <DocumentTitle>{t('Subscriptions')}</DocumentTitle>
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
