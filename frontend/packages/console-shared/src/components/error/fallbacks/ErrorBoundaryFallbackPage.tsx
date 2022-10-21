import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';
import { ExpandCollapse } from '@console/internal/components/utils/expand-collapse';
import ErrorDetailsBlock from './ErrorDetailsBlock';

/**
 * Standard fallback catch -- expected to take up the whole page.
 */
const ErrorBoundaryFallbackPage: React.FC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <Text component={TextVariants.h1} className="co-m-pane__heading co-m-pane__heading--center">
        {t('console-shared~Oh no! Something went wrong.')}
      </Text>
      <ExpandCollapse
        textCollapsed={t('console-shared~Show details')}
        textExpanded={t('console-shared~Hide details')}
      >
        <ErrorDetailsBlock {...props} />
      </ExpandCollapse>
    </div>
  );
};

export default ErrorBoundaryFallbackPage;
