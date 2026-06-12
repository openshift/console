import type { FC } from 'react';
import {
  Progress,
  ProgressSize,
  Alert,
  ExpandableSection,
  Button,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import {
  getNodeMaintenanceReason,
  getNodeMaintenanceCreationTimestamp,
  getNodeMaintenanceProgressPercent,
  getNodeMaintenanceLastError,
  getNodeMaintenancePendingPods,
} from '../../selectors/node-maintenance';
import { useStopNodeMaintenanceModal } from '../modals/StopNodeMaintenanceModal';
import MaintenancePopoverPodList from './MaintenancePopoverPodList';

type StartingMaintenancePopoverContentProps = {
  nodeMaintenance: K8sResourceKind;
};

const StartingMaintenancePopoverContent: FC<StartingMaintenancePopoverContentProps> = ({
  nodeMaintenance,
}) => {
  const { t } = useTranslation('metal3-plugin');
  const stopNodeMaintenanceModalLauncher = useStopNodeMaintenanceModal();
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
      <DescriptionList>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Maintenance reason:')}</DescriptionListTerm>
          <DescriptionListDescription>{reason}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Requested:')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Timestamp timestamp={creationTimestamp} />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
      <br />
      {lastError && (
        <>
          <Alert variant="warning" title={t('Workloads failing to move')} isInline>
            {lastError}
          </Alert>
          <br />
        </>
      )}
      <Progress
        value={getNodeMaintenanceProgressPercent(nodeMaintenance)}
        title={t('Moving workloads')}
        size={ProgressSize.sm}
      />
      <br />
      <ExpandableSection
        toggleText={t('Show remaining workloads ({{listLength}})', {
          listLength: pendingPods.length,
        })}
      >
        <MaintenancePopoverPodList pods={pendingPods} />
      </ExpandableSection>
      <br />
      <Button
        variant="link"
        onClick={() => stopNodeMaintenanceModalLauncher(nodeMaintenance)}
        isInline
      >
        {t('Stop maintenance')}
      </Button>
    </>
  );
};

export default StartingMaintenancePopoverContent;
