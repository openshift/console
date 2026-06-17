import type { FC } from 'react';
import { EmptyState, EmptyStateBody, EmptyStateVariant } from '@patternfly/react-core';
import { RhStandardInfoIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

const HelmReleaseNotesEmptyState: FC = () => {
  const { t } = useTranslation('helm-plugin');
  return (
    <EmptyState
      headingLevel="h2"
      icon={RhStandardInfoIcon}
      titleText={<>{t('No release notes available')}</>}
      variant={EmptyStateVariant.full}
    >
      <EmptyStateBody>{t('Release notes are not available for this Helm Chart.')}</EmptyStateBody>
    </EmptyState>
  );
};

export default HelmReleaseNotesEmptyState;
