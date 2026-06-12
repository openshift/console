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
export const ErrorBoundaryFallbackPage: FC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation('console-shared');
  return (
    <ErrorState
      titleText={t('Something wrong happened')}
      defaultBodyText={t('An error occurred. Please try again.')}
      bodyText={props.errorMessage}
      headingLevel="h1"
      customFooter={
        <ActionList>
          <ActionListGroup>
            <ActionListItem>
              <Button variant="primary" data-test="error-reload-page" onClick={reloadPage}>
                {t('Reload page')}
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
