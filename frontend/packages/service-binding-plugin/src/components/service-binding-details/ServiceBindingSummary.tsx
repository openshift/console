import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink, DetailsItem, LabelList } from '@console/internal/components/utils';
import { useModelFinder } from '@console/internal/module/k8s';
import { ServiceBinding } from '../../types';
import ServiceBindingStatus from '../service-binding-status/ServiceBindingStatus';

type ServiceBindingSummaryProps = {
  serviceBinding: ServiceBinding;
};

const ServiceBindingSummary: React.FC<ServiceBindingSummaryProps> = ({ serviceBinding }) => {
  const { findModel } = useModelFinder();
  const { t } = useTranslation();

  const model = findModel(
    serviceBinding.spec.application.group,
    serviceBinding.spec.application.resource,
  );

  return (
    <dl>
      <dt>{t('service-binding-plugin~Status')}</dt>
      <dd>
        <ServiceBindingStatus serviceBinding={serviceBinding} />
      </dd>

      {serviceBinding.spec?.application?.labelSelector ? (
        <DetailsItem
          label={t('service-binding-plugin~Label Selector')}
          obj={serviceBinding}
          path="spec.application.labelSelector"
        >
          {(
            <LabelList
              kind={model.kind}
              labels={serviceBinding.spec.application.labelSelector.matchLabels}
            />
          ) || '-'}
        </DetailsItem>
      ) : (
        <DetailsItem
          label={t('service-binding-plugin~Application')}
          obj={serviceBinding}
          path="spec.application"
        >
          {serviceBinding.spec.application?.name || '-'}
        </DetailsItem>
      )}

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
