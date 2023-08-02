import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons/dist/esm/icons/topology-icon';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';

type LimitExceededStateProps = {
  onShowTopologyAnyway: () => void;
};

export const LimitExceededState: React.FC<LimitExceededStateProps> = ({ onShowTopologyAnyway }) => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <EmptyStateHeader
        titleText={<>{t(`topology~Loading is taking longer than expected`)}</>}
        icon={<EmptyStateIcon icon={TopologyIcon} />}
        headingLevel="h4"
      />
      <EmptyStateBody>
        {t(
          `topology~We noticed that it is taking a long time to visualize your application Topology. You can use Search to find specific resources or click Continue to keep waiting.`,
        )}
      </EmptyStateBody>
      <EmptyStateFooter>
        <Button variant="primary" component={(props) => <Link {...props} to="/search-page" />}>
          {t('topology~Go to Search')}
        </Button>
        <EmptyStateActions>
          <Button variant="link" onClick={onShowTopologyAnyway}>
            {t('topology~Continue')}
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};
