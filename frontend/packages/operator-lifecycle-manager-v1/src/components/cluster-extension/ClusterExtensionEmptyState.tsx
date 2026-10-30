import type { FC } from 'react';
import { Content, ContentVariants } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { OLMV1_CATALOG_PATH } from '@console/operator-lifecycle-manager/src/const';
import { ConsoleEmptyState } from '@console/shared/src/components/empty-state/ConsoleEmptyState';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { FLAG_CLUSTER_CATALOG_API } from '../../const';

/**
 * Shown on the OLMv1 tab when no ClusterExtension is installed. Mirrors the Classic
 * (OLMv0) empty state so the two tabs read the same. ClusterExtensions are cluster scoped, so
 * unlike Classic there is no per-project variant of the message.
 */
export const ClusterExtensionEmptyState: FC = () => {
  const { t } = useTranslation('olm-v1');
  // Cluster extensions require the ClusterCatalog API.
  const hasCatalogAccess = useFlag(FLAG_CLUSTER_CATALOG_API);

  return (
    <ConsoleEmptyState title={t('No Operators installed')}>
      <Content component={ContentVariants.p}>
        {t('This cluster does not have any Operators installed as cluster extensions.')}
      </Content>
      {hasCatalogAccess ? (
        <Content component={ContentVariants.p}>
          <Trans ns="olm-v1">
            Discover and install Operators from the{' '}
            <Link to={OLMV1_CATALOG_PATH}>Cluster extensions catalog</Link>.
          </Trans>
        </Content>
      ) : (
        <Content component={ContentVariants.p}>
          {t(
            'To install Operators as cluster extensions, enable Technology Preview and configure a ClusterCatalog. If you do not have permission to do this, contact your cluster administrator.',
          )}
        </Content>
      )}
    </ConsoleEmptyState>
  );
};
