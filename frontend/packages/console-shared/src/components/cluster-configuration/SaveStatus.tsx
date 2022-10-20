import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export type SaveStatusProps = {
  status: 'pending' | 'in-progress' | 'successful' | 'error';
  error?: Error;
};

export const SaveStatus: React.FC<SaveStatusProps> = ({ status, error }) => {
  const { t } = useTranslation();
  if (status === 'successful') {
    return (
      <Alert variant="success" isInline title={t('console-shared~Saved.')}>
        {t(
          'console-shared~This config update requires a console rollout, this can take up to a minute and require a browser refresh.',
        )}
      </Alert>
    );
  }
  if (status === 'error') {
    return (
      <Alert variant="danger" isInline title={t('console-shared~Could not save configuration.')}>
        {error?.message?.toString?.() || error?.toString?.()}
      </Alert>
    );
  }
  return null;
};
