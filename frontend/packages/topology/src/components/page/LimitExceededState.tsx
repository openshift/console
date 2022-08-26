import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  Title,
} from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type LimitExceededStateProps = {
  onShowTopologyAnyway: () => void;
};

export const LimitExceededState: React.FC<LimitExceededStateProps> = ({ onShowTopologyAnyway }) => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <EmptyStateIcon variant="container" component={TopologyIcon} />
      <Title headingLevel="h4" size="lg">
        {t(`topology~Loading is taking longer than expected`)}
      </Title>
      <EmptyStateBody>
        {t(
          `topology~We noticed that it is taking a long time to visualize your application Topology. You can use Search to find specific resources or click Continue to keep waiting.`,
        )}
      </EmptyStateBody>
      <Button variant="primary" component={(props) => <Link {...props} to="/search-page" />}>
        {t('topology~Go to Search')}
      </Button>
      <EmptyStateSecondaryActions>
        <Button variant="link" onClick={onShowTopologyAnyway}>
          {t('topology~Continue')}
        </Button>
      </EmptyStateSecondaryActions>
    </EmptyState>
  );
};
