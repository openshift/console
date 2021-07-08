import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

interface EventSourceAlertProps {
  isValidSource: boolean;
  createSourceAccessLoading: boolean;
  createSourceAccess: boolean;
}

const EventSourceAlert: React.FC<EventSourceAlertProps> = ({
  isValidSource,
  createSourceAccessLoading,
  createSourceAccess,
}) => {
  const { t } = useTranslation();
  const showAlert = !isValidSource || (!createSourceAccessLoading && !createSourceAccess);

  return showAlert ? (
    <Alert
      variant={!isValidSource ? 'danger' : 'default'}
      title={t('knative-plugin~Event source cannot be created')}
      isInline
    >
      {!isValidSource && t('knative-plugin~Event source is not found on this Cluster.')}
      {!createSourceAccessLoading &&
        !createSourceAccess &&
        isValidSource &&
        t('knative-plugin~You do not have create access for Event Source in this project.')}
    </Alert>
  ) : null;
};

export default EventSourceAlert;
