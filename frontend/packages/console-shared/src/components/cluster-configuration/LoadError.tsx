import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const LoadError: FC<{ error?: Error }> = ({ error }) => {
  const { t } = useTranslation('console-shared');
  if (!error) {
    return null;
  }
  return (
    <Alert variant="warning" isInline title={t('Could not load configuration.')}>
      {error.message?.toString?.() || error.toString?.()}
    </Alert>
  );
};
