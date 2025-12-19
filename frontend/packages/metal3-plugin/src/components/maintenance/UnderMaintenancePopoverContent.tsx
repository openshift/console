import type { FC } from 'react';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { getNodeMaintenanceReason, getNodeMaintenanceCreationTimestamp } from '../../selectors';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';

type UnderMaintenancePopoverContentProps = {
  nodeMaintenance: K8sResourceKind;
};

const UnderMaintenancePopoverContent: FC<UnderMaintenancePopoverContentProps> = ({
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
      <DescriptionList>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('metal3-plugin~Maintenance reason:')}</DescriptionListTerm>
          <DescriptionListDescription>{reason}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('metal3-plugin~Requested:')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Timestamp timestamp={creationTimestamp} />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
      <br />
      <Button variant="link" onClick={() => stopNodeMaintenanceModal(nodeMaintenance, t)} isInline>
        {t('metal3-plugin~Stop maintenance')}
      </Button>
    </>
  );
};

export default UnderMaintenancePopoverContent;
