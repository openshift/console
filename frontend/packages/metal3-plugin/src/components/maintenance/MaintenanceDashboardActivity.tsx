import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { NodeModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ActivityProgress } from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { getNodeMaintenanceProgressPercent } from '../../selectors';

const MaintenanceActivity: React.FC<MaintenanceActivityProps> = ({ resource }) => {
  const { t } = useTranslation();
  return (
    <ActivityProgress
      title={t('metal3-plugin~Starting maintenance')}
      progress={getNodeMaintenanceProgressPercent(resource)}
    >
      <ResourceLink kind={NodeModel.kind} name={resource.spec.nodeName} />
    </ActivityProgress>
  );
};

export default MaintenanceActivity;

type MaintenanceActivityProps = {
  resource: K8sResourceKind;
};
