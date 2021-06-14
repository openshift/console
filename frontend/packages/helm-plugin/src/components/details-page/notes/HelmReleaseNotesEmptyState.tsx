import * as React from 'react';
import {
  Title,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

const HelmReleaseNotesEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.full}>
      <EmptyStateIcon icon={InfoCircleIcon} />
      <Title headingLevel="h2" size="md">
        {t('helm-plugin~No release notes available')}
      </Title>
      <EmptyStateBody>
        {t('helm-plugin~Release notes are not available for this Helm Chart.')}
      </EmptyStateBody>
    </EmptyState>
  );
};

export default HelmReleaseNotesEmptyState;
