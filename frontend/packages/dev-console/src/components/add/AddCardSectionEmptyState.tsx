import type { FC, ComponentType } from 'react';
import { EmptyState, EmptyStateBody, EmptyStateVariant } from '@patternfly/react-core';
import { RhStandardAlertIcon, RhStandardPadlockLockedIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

type AddCardSectionEmptyStateProps = {
  accessCheckFailed?: boolean;
};

const AddCardSectionEmptyState: FC<AddCardSectionEmptyStateProps> = ({ accessCheckFailed }) => {
  const { t } = useTranslation('devconsole');
  const Icon: ComponentType<any> = accessCheckFailed
    ? RhStandardPadlockLockedIcon
    : RhStandardAlertIcon;
  const title: string = accessCheckFailed ? t('Access permissions needed') : t('Unable to load');
  const description: string = accessCheckFailed
    ? t('You do not have sufficient permissions to access these add options.')
    : t('Add options failed to load. Check your connection and reload the page.');
  return (
    <EmptyState
      headingLevel="h2"
      icon={Icon}
      titleText={<>{title}</>}
      variant={EmptyStateVariant.full}
    >
      <EmptyStateBody>{description}</EmptyStateBody>
    </EmptyState>
  );
};

export default AddCardSectionEmptyState;
