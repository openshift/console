import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { humanizeBinaryBytes } from '@console/internal/components/utils/';
import { getName } from '@console/shared';
import { calcPVsCapacity, getSCAvailablePVs } from '../../selectors';
import '../modals/add-capacity-modal/add-capacity-modal.scss';

const getAvailableCapacityElement = (
  t: TFunction,
  data: any[],
  replica: number,
  sc: StorageClassResourceKind,
): JSX.Element => {
  const pvs = getSCAvailablePVs(data, getName(sc));
  const availableCapacity = humanizeBinaryBytes(calcPVsCapacity(pvs)).string;
  return (
    <div data-test="ceph-add-capacity-element">
      {t('ceph-storage-plugin~{{availableCapacity}} /  {{replica}} replicas', {
        availableCapacity,
        replica,
      })}
    </div>
  );
};

const getCurrentCapacityElement = (data: any[]): JSX.Element => {
  const usedCapacity = humanizeBinaryBytes(data?.[1]);
  const totalCapacity = humanizeBinaryBytes(data?.[0]);
  return (
    <div className="text-muted" data-test="ceph-add-capacity-element">
      <strong>{`${usedCapacity.string} / ${totalCapacity.string}`}</strong>
    </div>
  );
};

export const Capacity: React.FC<CapacityProps> = ({
  data,
  loaded,
  loadError,
  capacityText,
  replica,
  storageClass,
}) => {
  const { t } = useTranslation();

  let capacityElement: JSX.Element;

  if (!loaded) {
    capacityElement = (
      <div className="skeleton-text ceph-add-capacity__current-capacity--loading" />
    );
  } else if (loadError) {
    capacityElement = <div className="text-muted">{t('ceph-storage-plugin~Not available')}</div>;
  } else {
    if (capacityText === 'Currently Used') capacityElement = getCurrentCapacityElement(data);
    if (capacityText === 'Available capacity')
      capacityElement = getAvailableCapacityElement(t, data, replica, storageClass);
  }

  return (
    <div className="ceph-add-capacity__current-capacity">
      <div className="text-secondary ceph-add-capacity__current-capacity--text">
        <strong>{t('ceph-storage-plugin~{{capacityText}}:', { capacityText })}</strong>
      </div>
      {capacityElement}
    </div>
  );
};

type CapacityProps = {
  data: any[];
  loaded: boolean;
  loadError: any;
  capacityText: string;
  replica?: number;
  storageClass?: StorageClassResourceKind;
};
