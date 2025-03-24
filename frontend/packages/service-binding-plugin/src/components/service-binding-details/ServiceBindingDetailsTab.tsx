import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Conditions } from '@console/internal/components/conditions';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ServiceBinding } from '../../types';
import ServiceBindingSummary from './ServiceBindingSummary';

type ServiceBindingDetailsTabProps = {
  obj: ServiceBinding;
};

const ServiceBindingDetailsTab: React.FC<ServiceBindingDetailsTabProps> = ({
  obj: serviceBinding,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <PaneBody>
        <SectionHeading text={t('service-binding-plugin~ServiceBinding details')} />

        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={serviceBinding} />
          </div>
          <div className="col-sm-6">
            <ServiceBindingSummary serviceBinding={serviceBinding} />
          </div>
        </div>
      </PaneBody>

      {serviceBinding.status?.conditions?.length ? (
        <PaneBody>
          <SectionHeading text={t('service-binding-plugin~Conditions')} />
          <Conditions conditions={serviceBinding.status.conditions} />
        </PaneBody>
      ) : null}
    </>
  );
};

export default ServiceBindingDetailsTab;
