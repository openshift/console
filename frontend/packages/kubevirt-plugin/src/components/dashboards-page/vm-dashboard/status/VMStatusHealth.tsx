import { isEmpty } from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { HourglassHalfIcon, OffIcon } from '@patternfly/react-icons';

import { VMStatusBundle } from '../../../../statuses/vm/types';
import { ImporterPods } from '../../../vm-status/vm-status';

type VMStatusHealthProps = {
  vmStatusBundle: VMStatusBundle;
};

const stateMapper = {
  Error: HealthState.ERROR,
  Running: HealthState.OK,
  Completed: HealthState.OK,
  Pending: HealthState.PROGRESS,
  Importing: HealthState.PROGRESS,
  Deleting: HealthState.PROGRESS,
  InProgress: HealthState.PROGRESS,
  Starting: HealthState.PROGRESS,
  Off: HealthState.PROGRESS,
  Other: HealthState.UNKNOWN,
};

const customIconMapper = {
  Pending: <HourglassHalfIcon />,
  Off: <OffIcon />,
};

const VMStatusHealth: React.FC<VMStatusHealthProps> = ({ vmStatusBundle }) => {
  const { t } = useTranslation();

  const { status, importerPodsStatuses } = vmStatusBundle;
  const message = vmStatusBundle?.message || vmStatusBundle?.detailedMessage;

  const simpleLabel = status.getSimpleLabel();

  const state = stateMapper[simpleLabel];

  return (
    <HealthItem
      title={t('kubevirt-plugin~Virtual Machine')}
      state={state}
      details={simpleLabel}
      icon={customIconMapper[simpleLabel]}
      popupTitle={t('kubevirt-plugin~Virtual Machine Status')}
    >
      {!isEmpty(message) && message}
      {importerPodsStatuses && <ImporterPods key="importerPods" statuses={importerPodsStatuses} />}
    </HealthItem>
  );
};

export default VMStatusHealth;
