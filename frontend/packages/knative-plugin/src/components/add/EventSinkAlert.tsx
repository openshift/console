import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

interface EventSinkAlertProps {
  isValidSink: boolean;
  createSinkAccessLoading: boolean;
  createSinkAccess: boolean;
}

const EventSinkAlert: React.FC<EventSinkAlertProps> = ({
  isValidSink,
  createSinkAccessLoading,
  createSinkAccess,
}) => {
  const { t } = useTranslation();
  const showAlert = !isValidSink || (!createSinkAccessLoading && !createSinkAccess);

  return showAlert ? (
    <Alert
      variant={!isValidSink ? 'danger' : 'default'}
      title={t('knative-plugin~Event sink cannot be created')}
      isInline
    >
      {!isValidSink && t('knative-plugin~Event sink is not found on this Cluster.')}
      {!createSinkAccessLoading &&
        !createSinkAccess &&
        isValidSink &&
        t('knative-plugin~You do not have create access for Event sink in this project.')}
    </Alert>
  ) : null;
};

export default EventSinkAlert;
