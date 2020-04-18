import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassResourceKind, K8sResourceKind } from '@console/internal/module/k8s';
import { humanizeBinaryBytes } from '@console/internal/components/utils/';
import { getName } from '@console/shared';
import { pvResource } from '../../constants/resources';
import { calcPVsCapacity, getSCAvailablePVs } from '../../selectors';
import '../modals/add-capacity-modal/_add-capacity-modal.scss';
import './pvs-available-capacity.scss';

export const PVsAvailableCapacity: React.FC<PVAvaialbleCapacityProps> = ({ replica, sc }) => {
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>(pvResource);
  let availableCapacity: string = '';

  let availableStatusEl = (
    <div className="skeleton-text ceph-pvs-available-capacity__current-capacity--loading" />
  );

  if ((loadError || data.length === 0) && loaded) {
    availableStatusEl = <div className="text-muted">Not Available</div>;
  } else if (loaded) {
    const pvs = getSCAvailablePVs(data, getName(sc));
    availableCapacity = humanizeBinaryBytes(calcPVsCapacity(pvs)).string;
    availableStatusEl = <div>{`${availableCapacity} / ${replica} replicas`}</div>;
  }

  return (
    <div className="ceph-add-capacity__current-capacity">
      <div className="text-secondary ceph-add-capacity__current-capacity--text">
        <strong>Available capacity:</strong>
      </div>
      {availableStatusEl}
    </div>
  );
};

type PVAvaialbleCapacityProps = {
  replica: string;
  sc: StorageClassResourceKind;
};
