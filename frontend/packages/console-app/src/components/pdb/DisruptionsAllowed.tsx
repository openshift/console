import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { YellowExclamationTriangleIcon } from '@console/dynamic-plugin-sdk';
import { PodDisruptionBudgetKind } from './types';
import { isDisruptionViolated } from './utils/get-pdb-resources';

const DisruptionsAllowed: React.FC<DisruptionsAllowedProps> = ({ pdb }) => {
  const { t } = useTranslation();
  const isPDBViolated = isDisruptionViolated(pdb);

  return (
    <>
      {pdb.status.disruptionsAllowed}{' '}
      {isPDBViolated && (
        <Tooltip content={t('console-app~Disruption not allowed')}>
          <YellowExclamationTriangleIcon />
        </Tooltip>
      )}
    </>
  );
};

type DisruptionsAllowedProps = {
  pdb: PodDisruptionBudgetKind;
};

export default DisruptionsAllowed;
