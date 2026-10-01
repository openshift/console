import type { FC } from 'react';
import { Flex } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import type { Page } from '@console/internal/components/utils/horizontal-nav';
import ClassicInstalledOperatorsPage from '@console/operator-lifecycle-manager/src/components/classic-operators/ClassicInstalledOperatorsPage';
import { CLASSIC_INSTALLED_TAB } from '@console/operator-lifecycle-manager/src/const';
import { MultiTabListPage } from '@console/shared/src/components/multi-tab-list/MultiTabListPage';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { FLAG_CLUSTER_EXTENSION_API, FLAG_OPERATOR_LIFECYCLE_MANAGER } from '../const';
import ClusterExtensionListPage from './cluster-extension/ClusterExtensionListPage';
import { OLMv1InfoPopover } from './OLMv1InfoPopover';

/**
 * Installed operators split across a Next-Gen (OLMv1) and a Classic (OLMv0) tab. Either OLM may be
 * absent, so each tab is gated on its own API. The NamespaceBar is always shown: the Classic list
 * is namespaced, while the cluster scoped Next-Gen list ignores the selection so that switching
 * tabs never loses it.
 */
const InstalledOperatorsTabbedPage: FC = () => {
  const { t } = useTranslation('olm-v1');
  const olmv1Enabled = useFlag(FLAG_CLUSTER_EXTENSION_API);
  const olmv0Enabled = useFlag(FLAG_OPERATOR_LIFECYCLE_MANAGER);

  const pages: Page[] = [
    ...(olmv1Enabled
      ? [
          {
            href: '',
            name: t('Next-Gen Operators'),
            badge: (
              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                <OLMv1InfoPopover />
              </Flex>
            ),
            component: ClusterExtensionListPage,
          },
        ]
      : []),
    ...(olmv0Enabled
      ? [
          {
            href: CLASSIC_INSTALLED_TAB,
            name: t('Classic Operators'),
            component: ClassicInstalledOperatorsPage,
          },
        ]
      : []),
  ];

  return (
    <>
      <NamespaceBar />
      <MultiTabListPage
        pages={pages}
        title={t('Installed Operators')}
        telemetryPrefix="Installed Operators"
      />
    </>
  );
};

export default InstalledOperatorsTabbedPage;
