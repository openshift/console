import * as React from 'react';
import { Progress, ProgressSize, Alert, ExpandableSection, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Timestamp } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  getNodeMaintenanceReason,
  getNodeMaintenanceCreationTimestamp,
  getNodeMaintenanceProgressPercent,
  getNodeMaintenanceLastError,
  getNodeMaintenancePendingPods,
} from '../../selectors';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';
import MaintenancePopoverPodList from './MaintenancePopoverPodList';

type StartingMaintenancePopoverContentProps = {
  nodeMaintenance: K8sResourceKind;
};

const StartingMaintenancePopoverContent: React.FC<StartingMaintenancePopoverContentProps> = ({
  nodeMaintenance,
}) => {
  const { t } = useTranslation();
  const reason = getNodeMaintenanceReason(nodeMaintenance);
  const creationTimestamp = getNodeMaintenanceCreationTimestamp(nodeMaintenance);
  const lastError = getNodeMaintenanceLastError(nodeMaintenance);
  const pendingPods = getNodeMaintenancePendingPods(nodeMaintenance);

  return (
    <>
      <p>
        {t(
          "metal3-plugin~Node is entering maintenance. The cluster will automatically rebuild node's data 30 minutes after entering maintenance.",
        )}
      </p>
      <dl>
        <dt>{t('metal3-plugin~Maintenance reason:')}</dt>
        <dd>{reason}</dd>
        <dt>{t('metal3-plugin~Requested:')}</dt>
        <dd>
          <Timestamp timestamp={creationTimestamp} />
        </dd>
      </dl>
      <br />
      {lastError && (
        <>
          <Alert variant="warning" title={t('metal3-plugin~Workloads failing to move')} isInline>
            {lastError}
          </Alert>
          <br />
        </>
      )}
      <Progress
        value={getNodeMaintenanceProgressPercent(nodeMaintenance)}
        title={t('metal3-plugin~Moving workloads')}
        size={ProgressSize.sm}
      />
      <br />
      <ExpandableSection
        toggleText={t('metal3-plugin~Show remaining workloads ({{listLength}})', {
          listLength: pendingPods.length,
        })}
      >
        <MaintenancePopoverPodList pods={pendingPods} />
      </ExpandableSection>
      <br />
      <Button variant="link" onClick={() => stopNodeMaintenanceModal(nodeMaintenance, t)} isInline>
        {t('metal3-plugin~Stop')}
      </Button>
    </>
  );
};

export default StartingMaintenancePopoverContent;
