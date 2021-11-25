import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ModalBody, ModalTitle } from '@console/internal/components/factory';
import { PermissionsItem } from './PermissionsItem';

import './virt-overview-permissions-card.scss';

type PermissionsCardPopoverProps = {
  capabilitiesData: { taskName: string; isLoading: boolean; allowed: boolean }[];
};

export const PermissionsCardPopover: React.FC<PermissionsCardPopoverProps> = ({
  capabilitiesData,
}) => {
  const { t } = useTranslation();

  const permissionsItems = React.useMemo(
    () =>
      capabilitiesData.map((task) => (
        <PermissionsItem
          task={task.taskName}
          capability={task.allowed}
          isLoading={task.isLoading}
        />
      )),
    [capabilitiesData],
  );

  const bodyContent = (
    <>
      <ModalTitle>{t('kubevirt-plugin~Permissions')}</ModalTitle>
      <ModalBody>
        <div className="kv-permissions-card__popover-table-header">
          <span>{t('kubevirt-plugin~Task')}</span>
          <span>{t('kubevirt-plugin~Capability')}</span>
        </div>
        {permissionsItems}
      </ModalBody>
    </>
  );

  return (
    <Popover position={PopoverPosition.top} bodyContent={bodyContent} maxWidth="600px">
      <Button
        id="virtualization-overview-permissions-popover-btn"
        className="pf-m-link--align-left"
        variant="link"
      >
        {t('kubevirt-plugin~Access Control')}
      </Button>
    </Popover>
  );
};
