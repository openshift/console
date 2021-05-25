import { isEmpty } from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';

import { VMStatusBundle } from '../../../../statuses/vm/types';
import { ImporterPods } from '../../../vm-status/vm-status';

type VMStatusHealthProps = {
  vmStatusBundle: VMStatusBundle;
  icon: React.ReactNode;
};

const VMStatusHealth: React.FC<VMStatusHealthProps> = ({ vmStatusBundle, icon }) => {
  const { t } = useTranslation();

  const { status, importerPodsStatuses } = vmStatusBundle;
  const message = vmStatusBundle?.message || vmStatusBundle?.detailedMessage;

  const simpleLabel = status.getSimpleLabel();

  return (
    <HealthItem
      title={t('kubevirt-plugin~Virtual Machine')}
      details={simpleLabel}
      icon={icon}
      popupTitle={t('kubevirt-plugin~Virtual Machine Status')}
    >
      {!isEmpty(message) && message}
      {importerPodsStatuses && <ImporterPods key="importerPods" statuses={importerPodsStatuses} />}
    </HealthItem>
  );
};

export default VMStatusHealth;
