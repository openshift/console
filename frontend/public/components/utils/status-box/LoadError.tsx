import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyStateVariant } from '@patternfly/react-core';
import { MsgBox } from '.';

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
    <MsgBox primaryActions={retry} title={t('public~Error loading {{label}}', { label })}>
      {children}
    </MsgBox>
  );
};
LoadError.displayName = 'LoadError';

type LoadErrorProps = {
  label: string;
  canRetry?: boolean;
};
