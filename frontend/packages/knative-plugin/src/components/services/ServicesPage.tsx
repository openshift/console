import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel } from '../../models';
import ServiceList from './ServiceList';

export interface ServicesPageProps {
  namespace: string;
}

const ServicesPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('knative-plugin~Services')}</title>
      </Helmet>
      <ListPage
        canCreate
        {...props}
        kind={referenceForModel(ServiceModel)}
        ListComponent={ServiceList}
      />
    </>
  );
};

export default ServicesPage;
