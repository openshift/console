import * as React from 'react';
import { EmptyState, EmptyStateIcon, TitleSizes, EmptyStateHeader } from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons/dist/esm/icons/virtual-machine-icon';
import { useTranslation } from 'react-i18next';

type EmptyStateNoVMsProps = {
  titleSize: TitleSizes;
  className?: string;
};

export const EmptyStateNoVMs: React.FC<EmptyStateNoVMsProps> = ({ className }) => {
  const { t } = useTranslation();

  return (
    <EmptyState className={className}>
      <EmptyStateHeader
        titleText={<>{t('kubevirt-plugin~No virtual machines found')}</>}
        icon={<EmptyStateIcon icon={VirtualMachineIcon} />}
        headingLevel="h4"
      />
    </EmptyState>
  );
};
