import type { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { NEXT_GEN_CATALOG_PATH } from '@console/operator-lifecycle-manager/src/const';
import { ConsoleEmptyState } from '@console/shared/src/components/empty-state/ConsoleEmptyState';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { FLAG_CLUSTER_CATALOG_API } from '../../const';

/**
 * Shown on the Next-Gen (OLMv1) tab when no ClusterExtension is installed. Mirrors the Classic
 * (OLMv0) empty state so the two tabs read the same. ClusterExtensions are cluster scoped, so
 * unlike Classic there is no per-project variant of the message.
 */
export const ClusterExtensionEmptyState: FC = () => {
  const { t } = useTranslation('olm-v1');
  // Without the ClusterCatalog CRD the Next-Gen catalog type is not registered, so the link would 404.
  const hasCatalogAccess = useFlag(FLAG_CLUSTER_CATALOG_API);

  return (
    <ConsoleEmptyState title={t('No Operators found')}>
      <div>{t('No Operators are available.')}</div>
      {hasCatalogAccess && (
        <div>
          <Trans ns="olm-v1">
            Discover and install Operators from the{' '}
            <Link to={NEXT_GEN_CATALOG_PATH}>Next-Gen Operators catalog</Link>.
          </Trans>
        </div>
      )}
    </ConsoleEmptyState>
  );
};
