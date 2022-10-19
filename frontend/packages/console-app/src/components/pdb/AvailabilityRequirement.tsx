import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { PodDisruptionBudgetKind } from './types';

const AvailabilityRequirement: React.FC<AvailabilityRequirementProps> = ({ pdb, replicas }) => {
  const { t } = useTranslation();
  return (
    <>
      {!_.isNil(pdb?.spec?.minAvailable)
        ? t('console-app~Min available {{minAvailable}} of {{count}} pod', {
            minAvailable: pdb.spec.minAvailable,
            count: replicas,
          })
        : t('console-app~Max unavailable {{maxUnavailable}} of {{count}} pod', {
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
