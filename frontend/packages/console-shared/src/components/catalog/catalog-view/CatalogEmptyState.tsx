import type { FC } from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  EmptyStateActions,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { RhStandardMagnifyingGlassIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

type CatalogEmptyStateProps = {
  onClear: () => void;
};

export const CatalogEmptyState: FC<CatalogEmptyStateProps> = ({ onClear }) => {
  const { t } = useTranslation('console-shared');
  return (
    <EmptyState
      headingLevel="h2"
      icon={RhStandardMagnifyingGlassIcon}
      titleText={<>{t('No results found')}</>}
      variant={EmptyStateVariant.full}
    >
      <EmptyStateBody>
        {t(
          'No results match the filter criteria. Remove filters or clear all filters to show results.',
        )}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant="link" onClick={onClear} data-test-id="catalog-clear-filters">
            {t('Clear all filters')}
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};
