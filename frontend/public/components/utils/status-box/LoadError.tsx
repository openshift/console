import * as React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
} from '@patternfly/react-core';

export const LoadError: React.FC<LoadErrorProps> = ({ label, children, canRetry = true }) => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <EmptyStateHeader titleText={t('public~Error Loading {{label}}', { label })} />
      {children && <EmptyStateBody>{children}</EmptyStateBody>}
      {canRetry && (
        <EmptyStateFooter>
          <EmptyStateActions>
            <Trans ns="public">
              Please{' '}
              <Button
                type="button"
                onClick={window.location.reload.bind(window.location)}
                variant="link"
                isInline
              >
                try again
              </Button>
              .
            </Trans>
          </EmptyStateActions>
        </EmptyStateFooter>
      )}
    </EmptyState>
  );
};
LoadError.displayName = 'LoadError';

type LoadErrorProps = {
  label: string;
  canRetry?: boolean;
};
