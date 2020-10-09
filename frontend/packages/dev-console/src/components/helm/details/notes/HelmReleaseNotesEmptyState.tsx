import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Title,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';

const HelmReleaseNotesEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.full}>
      <EmptyStateIcon icon={InfoCircleIcon} />
      <Title headingLevel="h2" size="md">
        {t('devconsole~No Release Notes Available')}
      </Title>
      <EmptyStateBody>
        {t('devconsole~Release Notes are not available for this Helm Chart.')}
      </EmptyStateBody>
    </EmptyState>
  );
};

export default HelmReleaseNotesEmptyState;
