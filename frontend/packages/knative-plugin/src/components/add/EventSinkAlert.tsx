import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

interface EventSinkAlertProps {
  isValidSink: boolean;
  createSinkAccessLoading: boolean;
  createSinkAccess: boolean;
}

const EventSinkAlert: FC<EventSinkAlertProps> = ({
  isValidSink,
  createSinkAccessLoading,
  createSinkAccess,
}) => {
  const { t } = useTranslation('knative-plugin');
  const showAlert = !isValidSink || (!createSinkAccessLoading && !createSinkAccess);

  return showAlert ? (
    <Alert
      variant={!isValidSink ? 'danger' : undefined}
      title={t('Event sink cannot be created')}
      isInline
    >
      {!isValidSink && t('Event sink is not found on this Cluster.')}
      {!createSinkAccessLoading &&
        !createSinkAccess &&
        isValidSink &&
        t('You do not have create access for Event sink in this project.')}
    </Alert>
  ) : null;
};

export default EventSinkAlert;
