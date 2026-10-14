import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { FLAG_TECH_PREVIEW } from '@console/app/src/consts';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { NEXT_GEN_CATALOG_PATH } from '../../const';

/**
 * Shown on every Classic (OLMv0) surface. Deliberately not dismissible: steering users towards
 * Next-Gen operators are available through the OLM generation filter and Installed Operators tab.
 *
 * Gated here rather than at each call site: Next-Gen only exists in Tech Preview, so outside it
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
      title={t('Migrate Classic Operators to Next-Gen Operators')}
    >
      <Trans t={t} ns="olm">
        Where a Next-Gen (OLMv1) equivalent exists, install it from the{' '}
        <Link to={NEXT_GEN_CATALOG_PATH}>Next-Gen Operators</Link> catalog instead.
      </Trans>
    </Alert>
  );
};
