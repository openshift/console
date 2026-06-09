import type { FC } from 'react';
import { EmptyState, EmptyStateBody, EmptyStateVariant } from '@patternfly/react-core';
import { RhUiInformationFillIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

const HelmReleaseNotesEmptyState: FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      headingLevel="h2"
      icon={RhUiInformationFillIcon}
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
