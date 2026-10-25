import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import './MaintenancePopoverPodList.scss';

type MaintenancePopoverPodListProps = {
  pods: string[];
};

const MaintenancePopoverPodList: FC<MaintenancePopoverPodListProps> = ({ pods }) => {
  const { t } = useTranslation('metal3-plugin');
  return (
    <List isPlain className="maintenance-popover-pod-list" aria-label={t('Remaining workloads')}>
      {pods.map((pod) => (
        <ListItem key={pod} className="maintenance-popover-pod-list__list-item">
          <ResourceLink kind={referenceForModel(PodModel)} name={pod} title={pod} />
        </ListItem>
      ))}
    </List>
  );
};

export default MaintenancePopoverPodList;
