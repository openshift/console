import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { GreenCheckCircleIcon, RedExclamationCircleIcon } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
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
    <DashboardCard data-test-id="kv-overview-permissions-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('kubevirt-plugin~Permissions')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
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
      </DashboardCardBody>
    </DashboardCard>
  );
};
