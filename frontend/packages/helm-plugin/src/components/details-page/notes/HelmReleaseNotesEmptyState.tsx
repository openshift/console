import * as React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateVariant } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { useTranslation } from 'react-i18next';

const HelmReleaseNotesEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      headingLevel="h2"
      icon={InfoCircleIcon}
      titleText={<>{t('helm-plugin~No release notes available')}</>}
      variant={EmptyStateVariant.full}
    >
      <EmptyStateBody>
        {t('helm-plugin~Release notes are not available for this Helm Chart.')}
      </EmptyStateBody>
    </EmptyState>
  );
};

export default HelmReleaseNotesEmptyState;
