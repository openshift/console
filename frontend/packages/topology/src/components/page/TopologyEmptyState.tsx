import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type TopologyEmptyStateProps = {
  setIsQuickSearchOpen: (isOpen: boolean) => void;
};

const TopologyEmptyState: React.FC<TopologyEmptyStateProps> = ({ setIsQuickSearchOpen }) => {
  const { t } = useTranslation();

  return (
    <EmptyState className="odc-topology__empty-state" variant={EmptyStateVariant.full}>
      <EmptyStateIcon variant="container" component={TopologyIcon} />
      <Title headingLevel="h3" size="lg">
        {t('topology~No resources found')}
      </Title>
      <EmptyStateSecondaryActions>
        <Trans t={t} ns="topology">
          <Button
            isInline
            variant="link"
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickSearchOpen(true);
            }}
          >
            Start building your application
          </Button>{' '}
          or visit the <Link to="/add">Add page</Link> for more details.
        </Trans>
      </EmptyStateSecondaryActions>
    </EmptyState>
  );
};

export default React.memo(TopologyEmptyState);
