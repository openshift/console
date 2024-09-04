import * as _ from 'lodash-es';
import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { Box } from '.';

export const LoadError: React.FC<LoadErrorProps> = ({
  label,
  className,
  message,
  canRetry = true,
}) => {
  const { t } = useTranslation();
  return (
    <Box className={className}>
      <div className="pf-v5-u-text-align-center cos-error-title">
        {_.isString(message)
          ? t('public~Error Loading {{label}}: {{message}}', {
              label,
              message,
            })
          : t('public~Error Loading {{label}}', { label })}
      </div>
      {canRetry && (
        <div className="pf-v5-u-text-align-center">
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
        </div>
      )}
    </Box>
  );
};
LoadError.displayName = 'LoadError';

type LoadErrorProps = {
  label: string;
  className?: string;
  message?: string;
  canRetry?: boolean;
};
