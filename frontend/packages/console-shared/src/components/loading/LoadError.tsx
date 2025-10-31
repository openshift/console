import * as React from 'react';
import type { ReactNode } from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ConsoleEmptyState } from '../empty-state';

export const LoadError: React.FCC<LoadErrorProps> = ({ label, children, canRetry = true }) => {
  const { t } = useTranslation('console-shared');
  const actions = canRetry
    ? [
        <Button
          key="try-again"
          type="button"
          onClick={() => window.location.reload()}
          variant="link"
          isInline
        >
          {t('Try again')}
        </Button>,
      ]
    : [];
  return (
    <ConsoleEmptyState primaryActions={actions} title={t('Error loading {{label}}', { label })}>
      {children}
    </ConsoleEmptyState>
  );
};
LoadError.displayName = 'LoadError';

type LoadErrorProps = {
  label: string;
  canRetry?: boolean;
  children?: ReactNode;
};
