import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Timestamp } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getNodeMaintenanceReason, getNodeMaintenanceCreationTimestamp } from '../../selectors';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';

type UnderMaintenancePopoverContentProps = {
  nodeMaintenance: K8sResourceKind;
};

const UnderMaintenancePopoverContent: React.FC<UnderMaintenancePopoverContentProps> = ({
  nodeMaintenance,
}) => {
  const { t } = useTranslation();
  const reason = getNodeMaintenanceReason(nodeMaintenance);
  const creationTimestamp = getNodeMaintenanceCreationTimestamp(nodeMaintenance);

  return (
    <>
      <p>
        {t(
          "metal3-plugin~Node is under maintenance. The cluster will automatically rebuild node's data 30 minutes after entering maintenance.",
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
      <Button variant="link" onClick={() => stopNodeMaintenanceModal(nodeMaintenance, t)} isInline>
        {t('metal3-plugin~Stop maintenance')}
      </Button>
    </>
  );
};

export default UnderMaintenancePopoverContent;
