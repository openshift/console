import * as React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useLocation, match as Match } from 'react-router-dom';
import {
  DashboardsPageProps,
  mapStateToProps,
} from '@console/internal/components/dashboard/dashboards-page/dashboards';
import { Page, HorizontalNav, LoadingBox, PageHeading } from '@console/internal/components/utils';
import { useFlag } from '@console/shared';
// eslint-disable-next-line import/no-named-default
import { default as OCSOverview, BLOCK_FILE } from './ocs-system-dashboard';
import { BlockPoolListPage } from '../block-pool/block-pool-list-page';
import { CEPH_STORAGE_NAMESPACE } from '../../constants';
import { ODF_MANAGED_FLAG } from '../../features';

type ODFSystemDashboardPageProps = Omit<DashboardsPageProps, 'match'> & {
  match: Match<{ systemName: string }>;
};

const ODFSystemDashboard: React.FC<ODFSystemDashboardPageProps> = ({
  kindsInFlight,
  k8sModels,
  ...rest
}) => {
  const { t } = useTranslation();
  const isManagedOdf = useFlag(ODF_MANAGED_FLAG);
  const { systemName } = rest.match.params;
  const poolsPage: Page = {
    href: 'pools',
    name: t('ceph-storage-plugin~Storage pools'),
    component: () => <BlockPoolListPage namespace={CEPH_STORAGE_NAMESPACE} />,
  };
  let pages: Page[];
  if (!isManagedOdf)
    pages = [
      {
        path: 'overview/:dashboard',
        href: 'overview/block-file',
        name: t('ceph-storage-plugin~Overview'),
        component: OCSOverview,
      },
      poolsPage,
    ];
  else pages = [poolsPage];

  const breadcrumbs = [
    {
      name: t('ceph-storage-plugin~Storage systems'),
      path: '/odf/systems',
    },
    {
      name: t('ceph-storage-plugin~Storage system details'),
      path: '',
    },
  ];

  const title = (rest.match.params as any).systemName;

  const location = useLocation();

  React.useEffect(() => {
    if (isManagedOdf) rest.history.push(`${location.pathname}/pools`);
    else if (location.pathname.endsWith(systemName)) {
      rest.history.push(`${location.pathname}/overview/${BLOCK_FILE}`);
    } else if (location.pathname.endsWith('overview')) {
      rest.history.push(`${location.pathname}/${BLOCK_FILE}`);
    }
  }, [rest.history, location.pathname, systemName, isManagedOdf]);

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
