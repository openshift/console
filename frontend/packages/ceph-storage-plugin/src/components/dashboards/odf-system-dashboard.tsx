import * as React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useLocation, match as Match } from 'react-router-dom';
import {
  DashboardsPageProps,
  mapStateToProps,
} from '@console/internal/components/dashboard/dashboards-page/dashboards';
import { Page, HorizontalNav, LoadingBox, PageHeading } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
// eslint-disable-next-line import/no-named-default
import { default as OCSOverview, BLOCK_FILE } from './ocs-system-dashboard';
import { BlockPoolListPage } from '../block-pool/block-pool-list-page';
import { CEPH_STORAGE_NAMESPACE } from '../../constants';
import { CephBlockPoolModel } from '../../models';

type ODFSystemDashboardPageProps = Omit<DashboardsPageProps, 'match'> & {
  match: Match<{ systemName: string }>;
};

const ODFSystemDashboard: React.FC<ODFSystemDashboardPageProps> = ({
  kindsInFlight,
  k8sModels,
  ...rest
}) => {
  const { t } = useTranslation();
  const { systemName } = rest.match.params;
  const pages: Page[] = [
    {
      path: 'overview/:dashboard',
      href: 'overview/block-file',
      name: t('ceph-storage-plugin~Overview'),
      component: OCSOverview,
    },
    {
      href: referenceForModel(CephBlockPoolModel),
      name: t('ceph-storage-plugin~BlockPools'),
      component: () => <BlockPoolListPage namespace={CEPH_STORAGE_NAMESPACE} />,
    },
  ];

  const breadcrumbs = [
    {
      name: t('ceph-storage-plugin~StorageSystems'),
      path: '/odf/systems',
    },
    {
      name: t('ceph-storage-plugin~StorageSystem details'),
      path: '',
    },
  ];

  const title = rest.match.params.systemName;

  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname.endsWith(systemName)) {
      rest.history.push(`${location.pathname}/overview/${BLOCK_FILE}`);
    } else if (location.pathname.endsWith('overview')) {
      rest.history.push(`${location.pathname}/${BLOCK_FILE}`);
    }
  }, [rest.history, location.pathname, systemName]);

  return kindsInFlight && k8sModels.size === 0 ? (
    <LoadingBox />
  ) : (
    <>
      <PageHeading title={title} breadcrumbs={breadcrumbs} detail />
      <HorizontalNav match={rest.match} pages={pages} noStatusBox />
    </>
  );
};

export default connect(mapStateToProps)(ODFSystemDashboard);
