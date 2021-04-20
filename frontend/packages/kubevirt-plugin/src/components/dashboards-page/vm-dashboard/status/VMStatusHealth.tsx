import * as React from 'react';
import { useTranslation } from 'react-i18next';

import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';

import { VMStatusBundle } from '../../../../statuses/vm/types';
import { ImporterPods } from '../../../vm-status/vm-status';

type VMStatusHealthProps = {
  vmStatusBundle: VMStatusBundle;
};

const VMStatusHealth: React.FC<VMStatusHealthProps> = ({ vmStatusBundle }) => {
  const { t } = useTranslation();

  const { status, importerPodsStatuses } = vmStatusBundle;
  const message = vmStatusBundle?.message || vmStatusBundle?.detailedMessage;

  const stateMapper = (statusLabel: string) => {
    const mapper = {
      Error: HealthState.ERROR,
      Running: HealthState.OK,
      Completed: HealthState.OK,
      Pending: HealthState.LOADING,
      Importing: HealthState.PROGRESS,
      InProgress: HealthState.PROGRESS,
      Starting: HealthState.PROGRESS,
      Off: HealthState.NOT_AVAILABLE,
      Other: HealthState.UNKNOWN,
    };

    return mapper[statusLabel];
  };

  return (
    <HealthItem
      title={t('kubevirt-plugin~Virtual Machine')}
      state={stateMapper(status.getSimpleLabel())}
      details={status.getSimpleLabel()}
      popupTitle={t('kubevirt-plugin~Virtual Machine Status')}
    >
      {message || t('kubevirt-plugin~Not Available')}
      <ImporterPods key="importerPods" statuses={importerPodsStatuses} />
    </HealthItem>
  );
};

export default VMStatusHealth;
