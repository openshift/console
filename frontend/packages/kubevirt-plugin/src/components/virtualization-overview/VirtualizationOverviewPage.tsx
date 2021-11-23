import * as React from 'react';
import { Alert, AlertVariant, Stack, StackItem } from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { withStartGuide } from '@console/internal/components/start-guide';
import { PageHeading, useAccessReview2 } from '@console/internal/components/utils';
import { CatalogSourceModel } from '@console/operator-lifecycle-manager';
import { RestoreGettingStartedButton, useActiveNamespace } from '@console/shared';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { NetworkAddonsConfigModel, VirtualMachineModel } from '../../models';
import { KUBEVIRT_QUICK_START_USER_SETTINGS_KEY } from './getting-started-card/const';
import { GettingStartedContainerCard } from './getting-started-card/GettingStartedContainerCard';
import { VirtOverviewInventoryCard } from './inventory-card/VirtOverviewInventoryCard';
import { VirtOverviewPermissionsCard } from './permissions-card/VirtOverviewPermissionsCard';
import { VirtOverviewActivityCard } from './VirtOverviewActivityCard';
import { VirtOverviewDetailsCard } from './VirtOverviewDetailsCard';
import { VirtOverviewStatusCard } from './VirtOverviewStatusCard';

const useOverviewCards = () => {
  const [catalogSourcesAllowed] = useAccessReview2({
    group: CatalogSourceModel.apiGroup,
    resource: CatalogSourceModel.plural,
    verb: 'list',
  });
  const [networkAddonsAllowed] = useAccessReview2({
    group: NetworkAddonsConfigModel.apiGroup,
    resource: NetworkAddonsConfigModel.plural,
    verb: 'list',
  });

  return {
    leftCards: catalogSourcesAllowed ? [{ Card: VirtOverviewDetailsCard }] : [],
    mainCards: [
      ...(networkAddonsAllowed ? [{ Card: VirtOverviewStatusCard }] : []),
      { Card: VirtOverviewInventoryCard },
    ],
    rightCards: [{ Card: VirtOverviewActivityCard }, { Card: VirtOverviewPermissionsCard }],
  };
};

export const WrappedVirtualizationOverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const [namespace] = useActiveNamespace();
  const [vmsAllowed] = useAccessReview2({
    namespace,
    group: VirtualMachineModel.apiGroup,
    resource: VirtualMachineModel.plural,
    verb: 'list',
  });
  const { leftCards, mainCards, rightCards } = useOverviewCards();

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
        <Stack hasGutter>
          <StackItem>
            {!vmsAllowed && (
              <Alert
                isInline
                variant={AlertVariant.warning}
                title={t('kubevirt-plugin~No access to virtual machines')}
              />
            )}
          </StackItem>
          <StackItem>
            <GettingStartedContainerCard />
            <DashboardGrid leftCards={leftCards} mainCards={mainCards} rightCards={rightCards} />
          </StackItem>
        </Stack>
      </Dashboard>
    </>
  );
};

const VirtualizationOverviewPage = withStartGuide(WrappedVirtualizationOverviewPage);

export { VirtualizationOverviewPage };
