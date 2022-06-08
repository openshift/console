import * as React from 'react';
import { useTranslation } from 'react-i18next';
import Status from '@console/dynamic-plugin-sdk/src/app/components/status/Status';
import { ComputedServiceBindingStatus, ServiceBinding } from '../../types';
import { getComputedServiceBindingStatus, getFirstServiceBindingError } from '../../utils';

const ServiceBindingStatus = ({ serviceBinding }: { serviceBinding: ServiceBinding }) => {
  const { t } = useTranslation();

  const computedStatus = getComputedServiceBindingStatus(serviceBinding);

  if (computedStatus === ComputedServiceBindingStatus.CONNECTED) {
    return <Status status={computedStatus} title={t('service-binding-plugin~Connected')} />;
  }

  if (computedStatus === ComputedServiceBindingStatus.ERROR) {
    const firstError = getFirstServiceBindingError(serviceBinding);
    return (
      <Status status="Error" title={t('service-binding-plugin~Error')}>
        {firstError ? (
          <>
            <pre>{firstError.reason}</pre>
            {firstError.message}
          </>
        ) : null}
      </Status>
    );
  }

  return <Status status={computedStatus} />;
};

export default ServiceBindingStatus;
