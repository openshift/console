import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { ConsoleEmptyState } from './ConsoleEmptyState';

export const LoadError: React.FC<LoadErrorProps> = ({ label, children, canRetry = true }) => {
  const { t } = useTranslation();
  const retry = canRetry && (
    <Button
      type="button"
      onClick={window.location.reload.bind(window.location)}
      variant="link"
      isInline
    >
      {t('Try again')}
    </Button>
  );
  return (
    <ConsoleEmptyState
      primaryActions={retry}
      title={t('public~Error loading {{label}}', { label })}
    >
      {children}
    </ConsoleEmptyState>
  );
};
LoadError.displayName = 'LoadError';

type LoadErrorProps = {
  label: string;
  canRetry?: boolean;
};
