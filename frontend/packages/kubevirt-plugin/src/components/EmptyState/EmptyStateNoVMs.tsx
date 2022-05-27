import * as React from 'react';
import { EmptyState, EmptyStateIcon, Title, TitleSizes } from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

type EmptyStateNoVMsProps = {
  titleSize: TitleSizes;
  className?: string;
};

export const EmptyStateNoVMs: React.FC<EmptyStateNoVMsProps> = ({ titleSize, className }) => {
  const { t } = useTranslation();

  return (
    <EmptyState className={className}>
      <EmptyStateIcon icon={VirtualMachineIcon} />
      <Title headingLevel="h4" size={titleSize}>
        {t('kubevirt-plugin~No virtual machines found')}
      </Title>
    </EmptyState>
  );
};
