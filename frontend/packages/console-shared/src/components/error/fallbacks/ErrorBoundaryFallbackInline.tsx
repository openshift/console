import type { FC } from 'react';
import { Alert, ButtonVariant, Split, SplitItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';
import { ErrorDetailsModal } from '@console/shared/src/components/modals/ErrorDetailsModal';

/**
 * Support for error boundary content that won't consume the whole page.
 */
const ErrorBoundaryFallbackInline: FC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Split hasGutter>
      <SplitItem>
        <Alert variant="danger" isInline isPlain title={t('console-shared~Extension error')} />
      </SplitItem>
      <SplitItem>
        <ErrorDetailsModal
          buttonProps={{ variant: ButtonVariant.link, isInline: true }}
          {...props}
        />
      </SplitItem>
    </Split>
  );
};

export default ErrorBoundaryFallbackInline;
