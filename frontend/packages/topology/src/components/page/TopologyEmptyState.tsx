import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons/dist/esm/icons/topology-icon';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';

type TopologyEmptyStateProps = {
  setIsQuickSearchOpen: (isOpen: boolean) => void;
};

const TopologyEmptyState: React.FC<TopologyEmptyStateProps> = ({ setIsQuickSearchOpen }) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      className="odc-topology__empty-state"
      variant={EmptyStateVariant.full}
      data-test="no-resources-found"
    >
      <EmptyStateHeader
        titleText={<>{t('topology~No resources found')}</>}
        icon={<EmptyStateIcon icon={TopologyIcon} />}
        headingLevel="h3"
      />
      <EmptyStateFooter>
        <EmptyStateActions>
          <Trans t={t} ns="topology">
            <Button
              isInline
              variant="link"
              data-test="start-building-your-application"
              onClick={(e) => {
                e.stopPropagation();
                setIsQuickSearchOpen(true);
              }}
            >
              Start building your application
            </Button>
            {' or visit the '}
            <Link to="/add" data-test="add-page">
              Add page
            </Link>
            {' for more details.'}
          </Trans>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default React.memo(TopologyEmptyState);
