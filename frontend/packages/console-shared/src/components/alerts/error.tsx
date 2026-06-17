import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const ErrorAlert: FC<Props> = ({ message, title }) => {
  const { t } = useTranslation('console-shared');

  return (
    <Alert
      isInline
      className="co-alert co-alert--scrollable"
      title={title || t('An error occurred')}
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
