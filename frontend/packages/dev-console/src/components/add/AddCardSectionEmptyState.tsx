import * as React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateVariant } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { LockIcon } from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import { useTranslation } from 'react-i18next';

type AddCardSectionEmptyStateProps = {
  accessCheckFailed?: boolean;
};

const AddCardSectionEmptyState: React.FC<AddCardSectionEmptyStateProps> = ({
  accessCheckFailed,
}) => {
  const { t } = useTranslation();
  const Icon: React.ComponentType<any> = accessCheckFailed ? LockIcon : ExclamationCircleIcon;
  const title: string = accessCheckFailed
    ? t('devconsole~Access permissions needed')
    : t('devconsole~Unable to load');
  const description: string = accessCheckFailed
    ? t('devconsole~You do not have sufficient permissions to access these add options.')
    : t('devconsole~Add options failed to load. Check your connection and reload the page.');
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
