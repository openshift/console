import type { FC } from 'react';
import { useMemo } from 'react';
import { Flex } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import { AsyncComponent } from '@console/internal/components/utils';
import type { Page } from '@console/internal/components/utils';
import { MultiTabListPage } from '@console/shared';
import ClusterExtensionListPage from '../cluster-extension/ClusterExtensionListPage';
import { OLMv1TechPreviewBadge } from '../OLMv1TechPreviewBadge';

const InstalledSoftwarePage: FC = () => {
  const { t } = useTranslation();
  const { ns } = useParams<{ ns?: string }>();

  const clusterExtensionsPage = useMemo<Page>(
    () => ({
      href: '',
      name: t('olm-v1~Cluster extensions (OLMv1)'),
      badge: [
        <Flex key="olmv1-tech-preview-badge" alignItems={{ default: 'alignItemsCenter' }}>
          <OLMv1TechPreviewBadge />
        </Flex>,
      ],
      component: () => <ClusterExtensionListPage />,
    }),
    [t],
  );

  const clusterServiceVersionsPage = useMemo<Page>(
    () => ({
      href: 'olmv0-operators',
      name: t('olm-v1~Operators (OLMv0)'),
      component: () => (
        <AsyncComponent
          loader={() =>
            import('@console/operator-lifecycle-manager/src/components/clusterserviceversion').then(
              (m) => m.ClusterServiceVersionsPage,
            )
          }
          namespace={ns}
          showTitle={false}
        />
      ),
    }),
    [ns, t],
  );

  const pages = useMemo<Page[]>(() => [clusterExtensionsPage, clusterServiceVersionsPage], [
    clusterExtensionsPage,
    clusterServiceVersionsPage,
  ]);

  return (
    <>
      <NamespaceBar />
      <MultiTabListPage title={t('olm-v1~Installed Software')} pages={pages} />
    </>
  );
};

export default InstalledSoftwarePage;
