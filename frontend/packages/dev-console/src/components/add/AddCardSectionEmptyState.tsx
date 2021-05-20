import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, LockIcon } from '@patternfly/react-icons';

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
    <EmptyState variant={EmptyStateVariant.full}>
      <EmptyStateIcon
        icon={Icon}
        color={
          accessCheckFailed
            ? 'var(--pf-global--icon--Color--light)'
            : 'var(--pf-global--danger-color--100)'
        }
      />
      <Title headingLevel="h2" size="lg">
        {title}
      </Title>
      <EmptyStateBody>{description}</EmptyStateBody>
    </EmptyState>
  );
};

export default AddCardSectionEmptyState;
