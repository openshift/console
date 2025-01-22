import * as React from 'react';
import { Alert, Label, Popover } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { ServiceBindingModel } from '../../models';
import { getBrandingDetails } from '../../utils';
import './ServiceBindingAlerts.scss';

export interface ServiceBindingWarningProps {
  namespace: string;
}

export const ServiceBindingDeprecationAlertForTopology: React.FC = () => {
  const { t } = useTranslation();
  const productDetails = getBrandingDetails();
  return (
    <p>
      {t(
        'service-binding-plugin~Service Bindings is deprecated with OpenShift 4.15 and will be removed from a future release, currently planned as {{productName}} 4.18.',
        { productName: productDetails.productName },
      )}
    </p>
  );
};

export const ServiceBindingWarningForTopology: React.FC<ServiceBindingWarningProps> = ({
  namespace,
}) => {
  const { t } = useTranslation();

  const [serviceBindings, serviceBindingsLoaded] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: {
      group: ServiceBindingModel.apiGroup,
      kind: ServiceBindingModel.kind,
      version: ServiceBindingModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
  });

  return (
    <>
      {serviceBindingsLoaded && serviceBindings?.length > 0 && (
        <Popover bodyContent={<ServiceBindingDeprecationAlertForTopology />} triggerAction="hover">
          <Label status="warning" variant="outline">
            {t('service-binding-plugin~Service Bindings are deprecated')}
          </Label>
        </Popover>
      )}
    </>
  );
};

export const ServiceBindingDeprecationAlert: React.FC = () => {
  const { t } = useTranslation();
  const productDetails = getBrandingDetails();
  return (
    <Alert
      isInline
      variant="info"
      title={t('service-binding-plugin~Service Bindings is deprecated with {{productName}} 4.15', {
        productName: window.SERVER_FLAGS.branding === 'OKD' ? 'OKD' : 'OpenShift',
      })}
    >
      <p>
        {t(
          'service-binding-plugin~Feature development of Service Binding Operator is deprecated in {{productName}} 4.15.',
          { productName: productDetails.productName },
        )}
      </p>
      <p>
        {t(
          'service-binding-plugin~Service Bindings can still be created and shown in the OpenShift web console, but will be removed from a future release, currently planned as {{productName}} 4.18. You should migrate wherever it is possible.',
          { productName: productDetails.productName },
        )}
      </p>
    </Alert>
  );
};

export const ServiceBindingDeprecationAlertForModals: React.FC = () => {
  const { t } = useTranslation();
  const productDetails = getBrandingDetails();
  return (
    <Alert
      isInline
      variant="info"
      title={t('service-binding-plugin~Service Bindings is deprecated with {{productName}} 4.15', {
        productName: window.SERVER_FLAGS.branding === 'OKD' ? 'OKD' : 'OpenShift',
      })}
      className="service-binding-alert-modal"
    >
      <p>
        {t(
          'service-binding-plugin~Web console support will be removed from a future release, currently planned as {{productName}} 4.18. You should migrate wherever it is possible.',
          { productName: productDetails.productName },
        )}
      </p>
    </Alert>
  );
};
