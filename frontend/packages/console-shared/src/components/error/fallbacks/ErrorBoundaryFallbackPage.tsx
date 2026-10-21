import type { FC } from 'react';
import { ErrorState } from '@patternfly/react-component-groups';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Button,
  ButtonVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';
import { ErrorDetailsModal } from '@console/shared/src/components/modals/ErrorDetailsModal';

const reloadPage = () => {
  window.location.reload();
};

/**
 * Standard fallback catch -- expected to take up the whole page.
 */
const ErrorBoundaryFallbackPage: FC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation();
  return (
    <ErrorState
      titleText={t('console-shared~Something wrong happened')}
      defaultBodyText={t('console-shared~An error occurred. Please try again.')}
      bodyText={props.errorMessage}
      headingLevel="h1"
      customFooter={
        <ActionList>
          <ActionListGroup>
            <ActionListItem>
              <Button variant="primary" data-test="error-reload-page" onClick={reloadPage}>
                {t('console-shared~Reload page')}
              </Button>
            </ActionListItem>
            <ActionListItem>
              <ErrorDetailsModal buttonProps={{ variant: ButtonVariant.secondary }} {...props} />
            </ActionListItem>
          </ActionListGroup>
        </ActionList>
      }
    />
  );
};

export default ErrorBoundaryFallbackPage;
