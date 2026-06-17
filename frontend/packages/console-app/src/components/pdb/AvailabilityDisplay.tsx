import type { FC } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { DASH } from '@console/shared/src/constants/ui';
import type { PodDisruptionBudgetKind } from './types';

const AvailabilityDisplay: FC<AvailabilityDisplayProps> = ({ pdb }) => {
  const { t } = useTranslation('console-app');

  if (_.isNil(pdb.spec.maxUnavailable) && _.isNil(pdb.spec.minAvailable)) {
    return <>{DASH}</>;
  }

  if (_.isNil(pdb.spec.maxUnavailable)) {
    return <>{t('Min available {{minAvailable}}', { minAvailable: pdb.spec.minAvailable })}</>;
  }

  return (
    <>
      {t('Max unavailable {{maxUnavailable}}', {
        maxUnavailable: pdb.spec.maxUnavailable,
      })}
    </>
  );
};

type AvailabilityDisplayProps = {
  pdb: PodDisruptionBudgetKind;
};

export default AvailabilityDisplay;
