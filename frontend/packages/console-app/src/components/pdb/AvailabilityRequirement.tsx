import type { FC } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { PodDisruptionBudgetKind } from './types';

const AvailabilityRequirement: FC<AvailabilityRequirementProps> = ({ pdb, replicas }) => {
  const { t } = useTranslation('console-app');
  return (
    <>
      {!_.isNil(pdb?.spec?.minAvailable)
        ? t('Min available {{minAvailable}} of {{count}} pod', {
            minAvailable: pdb.spec.minAvailable,
            count: replicas,
          })
        : t('Max unavailable {{maxUnavailable}} of {{count}} pod', {
            maxUnavailable: pdb?.spec?.maxUnavailable,
            count: replicas,
          })}
    </>
  );
};

type AvailabilityRequirementProps = {
  pdb: PodDisruptionBudgetKind;
  replicas: number;
};

export default AvailabilityRequirement;
