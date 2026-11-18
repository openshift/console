import type { ComponentProps, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory/list-page';
import { referenceForModel } from '@console/internal/module/k8s/k8s-ref';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { EventingBrokerModel } from '../../../models';
import { BrokerList } from './BrokerList';

const BrokerListPage: FC<ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <>
      <DocumentTitle>{t('Brokers')}</DocumentTitle>
      <ListPage
        canCreate={false}
        {...props}
        kind={referenceForModel(EventingBrokerModel)}
        ListComponent={BrokerList}
        omitFilterToolbar
      />
    </>
  );
};

export default BrokerListPage;
