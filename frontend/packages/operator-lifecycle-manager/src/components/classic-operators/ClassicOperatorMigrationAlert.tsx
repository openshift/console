import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { FLAG_TECH_PREVIEW } from '@console/app/src/consts';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { OLMV1_CATALOG_PATH } from '../../const';

/**
 * Shown on every OLMv0 surface. Deliberately not dismissible: steering users towards
 * cluster extensions available through the Catalog filter and Installed Operators tab.
 *
 * Gated here rather than at each call site: OLMv1 only exists in Technology Preview, so outside it
 * there is nothing to migrate to and the OLMv0 pages must look exactly as they did before.
 */
export const ClassicOperatorMigrationAlert: FC = () => {
  const { t } = useTranslation('olm');
  const techPreview = useFlag(FLAG_TECH_PREVIEW);

  if (!techPreview) {
    return null;
  }

  return (
    <Alert
      data-test="classic-operator-migration-alert"
      isInline
      variant="warning"
      title={t('Migrate Classic Operators to cluster extensions')}
    >
      <Trans t={t} ns="olm">
        For production clusters, continue to use classic Operators. If this Operator is available as
        a cluster extension, you can install it for testing from the{' '}
        <Link to={OLMV1_CATALOG_PATH}>Cluster extensions catalog</Link>. Cluster extensions are a
        Technology Preview feature.
      </Trans>
    </Alert>
  );
};
