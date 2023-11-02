import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateHeader,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { useTranslation } from 'react-i18next';

const HelmReleaseNotesEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.full}>
      <EmptyStateHeader
        titleText={<>{t('helm-plugin~No release notes available')}</>}
        icon={<EmptyStateIcon icon={InfoCircleIcon} />}
        headingLevel="h2"
      />
      <EmptyStateBody>
        {t('helm-plugin~Release notes are not available for this Helm Chart.')}
      </EmptyStateBody>
    </EmptyState>
  );
};

export default HelmReleaseNotesEmptyState;
