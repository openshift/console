import * as React from 'react';
import { Card, CardBody, CardHeader, CardTitle, Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { GreenCheckCircleIcon, RedExclamationCircleIcon } from '@console/shared';
import { usePermissionsCardPermissions } from '../../../hooks/use-permissions-card-permissions';
import { PermissionsCardPopover } from './PermissionsCardPopover';
import { PermissionsCountItem } from './PermissionsCountItem';

import './virt-overview-permissions-card.scss';

export const VirtOverviewPermissionsCard: React.FC = () => {
  const { t } = useTranslation();
  const permissionsData = usePermissionsCardPermissions();
  const {
    capabilitiesData,
    permissionsLoading,
    numAllowedCapabilities,
    numNotAllowedCapabilities,
  } = permissionsData;

  return (
    <Card data-test-id="kv-overview-permissions-card">
      <CardHeader>
        <CardTitle>{t('kubevirt-plugin~Permissions')}</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="kv-permissions-card__status">
          <PermissionsCardPopover capabilitiesData={capabilitiesData}>
            {t('kubevirt-plugin~Access Control')}
          </PermissionsCardPopover>
          <Flex direction={{ default: 'row' }}>
            <FlexItem>
              <PermissionsCountItem
                count={numAllowedCapabilities}
                Icon={GreenCheckCircleIcon}
                isLoading={permissionsLoading}
              />
            </FlexItem>
            <FlexItem>
              <PermissionsCountItem
                count={numNotAllowedCapabilities}
                Icon={RedExclamationCircleIcon}
                isLoading={permissionsLoading}
              />
            </FlexItem>
          </Flex>
        </div>
      </CardBody>
    </Card>
  );
};
