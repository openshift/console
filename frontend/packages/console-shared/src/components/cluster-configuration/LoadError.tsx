import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const LoadError: FC<{ error?: Error }> = ({ error }) => {
  const { t } = useTranslation();
  if (!error) {
    return null;
  }
  return (
    <Alert variant="warning" isInline title={t('console-shared~Could not load configuration.')}>
      {error.message?.toString?.() || error.toString?.()}
    </Alert>
  );
};

export default LoadError;
