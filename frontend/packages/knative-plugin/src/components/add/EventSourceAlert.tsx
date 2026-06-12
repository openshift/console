import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

interface EventSourceAlertProps {
  isValidSource: boolean;
  createSourceAccessLoading: boolean;
  createSourceAccess: boolean;
}

const EventSourceAlert: FC<EventSourceAlertProps> = ({
  isValidSource,
  createSourceAccessLoading,
  createSourceAccess,
}) => {
  const { t } = useTranslation('knative-plugin');
  const showAlert = !isValidSource || (!createSourceAccessLoading && !createSourceAccess);

  return showAlert ? (
    <Alert
      variant={!isValidSource ? 'danger' : undefined}
      title={t('Event source cannot be created')}
      isInline
    >
      {!isValidSource && t('Event source is not found on this Cluster.')}
      {!createSourceAccessLoading &&
        !createSourceAccess &&
        isValidSource &&
        t('You do not have create access for Event Source in this project.')}
    </Alert>
  ) : null;
};

export default EventSourceAlert;
