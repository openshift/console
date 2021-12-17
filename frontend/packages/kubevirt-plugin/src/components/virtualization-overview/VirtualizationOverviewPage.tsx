import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { withStartGuide } from '@console/internal/components/start-guide';
import { PageHeading } from '@console/internal/components/utils';
import { RestoreGettingStartedButton } from '@console/shared';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { KUBEVIRT_QUICK_START_USER_SETTINGS_KEY } from './getting-started-card/const';
import { GettingStartedContainerCard } from './getting-started-card/GettingStartedContainerCard';
import { VirtOverviewInventoryCard } from './inventory-card/VirtOverviewInventoryCard';
import { VirtOverviewPermissionsCard } from './permissions-card/VirtOverviewPermissionsCard';
import { RunningVMsPerTemplateCard } from './running-vms-per-template-card/RunningVMsPerTemplateCard';
import { VirtOverviewActivityCard } from './VirtOverviewActivityCard';
import { VirtOverviewDetailsCard } from './VirtOverviewDetailsCard';
import { VirtOverviewStatusCard } from './VirtOverviewStatusCard';

const leftCards = [{ Card: VirtOverviewDetailsCard }, { Card: RunningVMsPerTemplateCard }];
const mainCards = [{ Card: VirtOverviewStatusCard }, { Card: VirtOverviewInventoryCard }];
const rightCards = [{ Card: VirtOverviewActivityCard }, { Card: VirtOverviewPermissionsCard }];

export const WrappedVirtualizationOverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const title = t('kubevirt-plugin~Virtualization Overview');
  const badge = (
    <RestoreGettingStartedButton userSettingsKey={KUBEVIRT_QUICK_START_USER_SETTINGS_KEY} />
  );

  return (
    <>
      <Helmet>
        <title>Virtualization Overview</title>
      </Helmet>
      <PageHeading title={title} detail badge={badge} />
      <Dashboard>
        <GettingStartedContainerCard />
        <DashboardGrid leftCards={leftCards} mainCards={mainCards} rightCards={rightCards} />
      </Dashboard>
    </>
  );
};

const VirtualizationOverviewPage = withStartGuide(WrappedVirtualizationOverviewPage);

export { VirtualizationOverviewPage };
