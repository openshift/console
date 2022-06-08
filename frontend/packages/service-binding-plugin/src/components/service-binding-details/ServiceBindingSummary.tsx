import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink, DetailsItem } from '@console/internal/components/utils';
import { ServiceBinding } from '../../types';
import ServiceBindingStatus from '../service-binding-status/ServiceBindingStatus';

type ServiceBindingSummaryProps = {
  serviceBinding: ServiceBinding;
};

const ServiceBindingSummary: React.FC<ServiceBindingSummaryProps> = ({ serviceBinding }) => {
  const { t } = useTranslation();

  return (
    <dl>
      <dt>{t('service-binding-plugin~Status')}</dt>
      <dd>
        <ServiceBindingStatus serviceBinding={serviceBinding} />
      </dd>

      <DetailsItem
        label={t('service-binding-plugin~Application')}
        obj={serviceBinding}
        path="spec.application"
      >
        {serviceBinding.spec.application?.name || '-'}
      </DetailsItem>

      <DetailsItem
        label={t('service-binding-plugin~Services')}
        obj={serviceBinding}
        path="spec.services"
      >
        {serviceBinding.spec?.services?.length
          ? serviceBinding.spec.services.map((service, index) => (
              <ResourceLink
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                groupVersionKind={service}
                namespace={serviceBinding.metadata.namespace}
                name={service.name}
              />
            ))
          : '-'}
      </DetailsItem>
    </dl>
  );
};

export default ServiceBindingSummary;
