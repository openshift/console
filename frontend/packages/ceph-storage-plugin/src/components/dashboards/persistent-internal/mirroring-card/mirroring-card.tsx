import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as classNames from 'classnames';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { K8sResourceKind } from '@console/internal/module/k8s/index';
import { useFlag } from '@console/shared';

import { StorageClusterKind } from '../../../../types';
import { ocsResource } from '../../../../resources';
import { GUARDED_FEATURES } from '../../../../features';
import '../../common/storage-efficiency/storage-efficiency-card.scss';

export const MirroringItemBody: React.FC<MirroringItemBodyProps> = React.memo(
  ({ title, isLoading, error, className, children }) => {
    const { t } = useTranslation();

    let status: React.ReactElement;

    if (isLoading) {
      status = <div className="skeleton-text ceph-storage-efficiency-card__item-body--loading" />;
    } else if (error) {
      status = (
        <span className="co-dashboard-text--small text-muted">
          {t('ceph-storage-plugin~Not available')}
        </span>
      );
    } else {
      status = <span className="ceph-storage-efficiency-card__item-text">{children}</span>;
    }
    return (
      <div className="co-inventory-card__item">
        <div className="ceph-storage-efficiency-card__item-title">{title}</div>
        <div
          className={classNames('ceph-storage-efficiency-card__item-status', className)}
          data-test={`${title}-mirroring-card-status`}
        >
          {status}
        </div>
      </div>
    );
  },
);

const MirroringCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const { t } = useTranslation();

  /** to-do: add a better way to filter cards based on the flag in ocs-system-dashboard.tsx file.
   * Right now even if we are returning null (when flag is set) from this component,
   * there is an extra spacing between cards because of the GridItem FC.
   */
  const isMirroringSupported = useFlag(GUARDED_FEATURES.OCS_POOL_MIRRORING);

  React.useEffect(() => {
    watchK8sResource(ocsResource);
    return () => {
      stopWatchK8sResource(ocsResource);
    };
  }, [watchK8sResource, stopWatchK8sResource]);

  if (isMirroringSupported) {
    const ocs = resources?.ocs;
    const ocsData = ocs?.data as K8sResourceKind[];
    const cluster = ocsData?.find((item: StorageClusterKind) => item.status.phase !== 'Ignored');
    const mirroringStatus: boolean = cluster?.spec?.mirroring?.enabled;
    const mirroringStatusProps = {
      title: t('ceph-storage-plugin~Mirroring Status'),
      isLoading: !ocs?.loaded,
      error: !!ocs?.loadError,
      className: 'co-dashboard-text--small text-muted',
    };

    return (
      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>{t('ceph-storage-plugin~Mirroring')}</DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardBody className="co-dashboard-card__body--no-padding">
          <MirroringItemBody {...mirroringStatusProps}>
            {mirroringStatus ? t('ceph-storage-plugin~Enabled') : t('ceph-storage-plugin~Disabled')}
          </MirroringItemBody>
        </DashboardCardBody>
      </DashboardCard>
    );
  }
  return <></>;
};

type MirroringItemBodyProps = {
  title: string;
  isLoading: boolean;
  error: boolean;
  className?: string;
  children: React.ReactNode;
};

export default withDashboardResources(MirroringCard);
