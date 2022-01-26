import * as React from 'react';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { VMStatusBundle } from '../../../../statuses/vm/types';
import { ImporterPods } from '../../../vm-status/vm-status';

type VMStatusHealthProps = {
  vmStatusBundle: VMStatusBundle;
  icon: React.ReactNode;
  printableStatus: string;
};

const VMStatusHealth: React.FC<VMStatusHealthProps> = ({
  vmStatusBundle,
  icon,
  printableStatus,
}) => {
  const { t } = useTranslation();

  const { status, importerPodsStatuses } = vmStatusBundle;
  const message = vmStatusBundle?.message || vmStatusBundle?.detailedMessage;

  const simpleLabel = printableStatus ?? status.getSimpleLabel();

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
