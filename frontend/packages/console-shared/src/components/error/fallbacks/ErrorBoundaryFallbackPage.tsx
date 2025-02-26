import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';
import { ExpandCollapse } from '@console/internal/components/utils/expand-collapse';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import PrimaryHeading from '../../heading/PrimaryHeading';
import ErrorDetailsBlock from './ErrorDetailsBlock';

/**
 * Standard fallback catch -- expected to take up the whole page.
 */
const ErrorBoundaryFallbackPage: React.FC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <PrimaryHeading centerText>{t('console-shared~Oh no! Something went wrong.')}</PrimaryHeading>
      <ExpandCollapse
        textCollapsed={t('console-shared~Show details')}
        textExpanded={t('console-shared~Hide details')}
      >
        <ErrorDetailsBlock {...props} />
      </ExpandCollapse>
    </PaneBody>
  );
};

export default ErrorBoundaryFallbackPage;
