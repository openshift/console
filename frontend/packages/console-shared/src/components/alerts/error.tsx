import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';

const ErrorAlert: React.FC<Props> = ({ message, title }) => {
  const { t } = useTranslation();

  return (
    <Alert
      isInline
      className="co-alert co-alert--scrollable"
      title={title || t('console-shared~An error occurred')}
      variant="danger"
    >
      {message}
    </Alert>
  );
};

type Props = {
  message: string;
  title?: string;
};

export default ErrorAlert;
