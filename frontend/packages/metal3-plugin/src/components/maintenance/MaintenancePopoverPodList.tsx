import * as React from 'react';
import { List, AutoSizer } from 'react-virtualized';
import { ResourceLink } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import './MaintenancePopoverPodList.scss';

const podRowRenderer = (pods) => ({ key, index, style }) => {
  const pod = pods[index];
  return (
    <div key={key} style={style} className="maintenance-popover-pod-list__list-item">
      <ResourceLink kind={referenceForModel(PodModel)} name={pod} title={pod} />
    </div>
  );
};

type MaintenancePopoverPodListProps = {
  pods: string[];
};
const MaintenancePopoverPodList: React.FC<MaintenancePopoverPodListProps> = ({ pods }) => (
  <AutoSizer disableHeight>
    {({ width }) => (
      <List
        width={width}
        height={pods.length < 6 ? pods.length * 30 : 150}
        rowCount={pods.length}
        rowHeight={30}
        rowRenderer={podRowRenderer(pods)}
      />
    )}
  </AutoSizer>
);

export default MaintenancePopoverPodList;
