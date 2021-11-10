import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StorageClassResourceKind, K8sResourceKind } from '@console/internal/module/k8s';
import { humanizeBinaryBytes } from '@console/internal/components/utils/';
import { getName } from '@console/shared';
import { calcPVsCapacity, getSCAvailablePVs } from '../../../selectors';
import './add-capacity-modal.scss';

export const PVsAvailableCapacity: React.FC<PVAvaialbleCapacityProps> = ({
  replica,
  storageClass,
  data,
  loaded,
  loadError,
}) => {
  const { t } = useTranslation();

  let availableCapacity: string = '';

  let availableStatusElement = (
    <div className="skeleton-text ceph-pvs-available-capacity__current-capacity--loading" />
  );

  if (loaded && !!getName(storageClass) && !loadError) {
    const pvs = getSCAvailablePVs(data, getName(storageClass));
    availableCapacity = humanizeBinaryBytes(calcPVsCapacity(pvs)).string;
    availableStatusElement = (
      <div>
        {t('ceph-storage-plugin~{{availableCapacity}} /  {{replica}} replicas', {
          availableCapacity,
          replica,
        })}
      </div>
    );
  } else if (loaded || loadError) {
    availableStatusElement = (
      <div className="text-muted">{t('ceph-storage-plugin~Not Available')}</div>
    );
  }

  return (
    <div className="ceph-add-capacity__current-capacity">
      <div className="text-secondary ceph-add-capacity__current-capacity--text">
        <strong>{t('ceph-storage-plugin~Available capacity:')}</strong>
      </div>
      {availableStatusElement}
    </div>
  );
};

type PVAvaialbleCapacityProps = {
  replica: number;
  storageClass: StorageClassResourceKind;
  data: K8sResourceKind[];
  loaded: boolean;
  loadError: any;
};
