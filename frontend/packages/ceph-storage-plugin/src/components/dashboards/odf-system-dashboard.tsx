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
import { useFlag } from '@console/shared/src/hooks/flag';
// eslint-disable-next-line import/no-named-default
import { default as OCSOverview, BLOCK_FILE, OBJECT } from './ocs-system-dashboard';
import { BlockPoolListPage } from '../block-pool/block-pool-list-page';
import { CEPH_STORAGE_NAMESPACE } from '../../constants';
import { CephBlockPoolModel } from '../../models';
import { MCG_FLAG, CEPH_FLAG } from '../../features';

type ODFSystemDashboardPageProps = Omit<DashboardsPageProps, 'match'> & {
  match: Match<{ systemName: string }>;
};

const blockPoolRef = referenceForModel(CephBlockPoolModel);

const ODFSystemDashboard: React.FC<ODFSystemDashboardPageProps> = ({
  kindsInFlight,
  k8sModels,
  ...rest
}) => {
  const { t } = useTranslation();
  const isObjectServiceAvailable = useFlag(MCG_FLAG);
  const isCephAvailable = useFlag(CEPH_FLAG);
  const { systemName } = rest.match.params;
  const dashboardTab = !isCephAvailable && isObjectServiceAvailable ? OBJECT : BLOCK_FILE;
  const defaultDashboard = React.useRef(dashboardTab);
  const [pages, setPages] = React.useState<Page[]>([
    {
      path: 'overview/:dashboard',
      href: `overview/${defaultDashboard.current}`,
      name: t('ceph-storage-plugin~Overview'),
      component: OCSOverview,
    },
  ]);

  React.useEffect(() => {
    const isBlockPoolAdded = pages.find((page) => page.href === blockPoolRef);
    if (isCephAvailable && !isBlockPoolAdded) {
      setPages([
        ...pages,
        {
          href: blockPoolRef,
          name: t('ceph-storage-plugin~BlockPools'),
          component: () => <BlockPoolListPage namespace={CEPH_STORAGE_NAMESPACE} />,
        },
      ]);
    }
  }, [isCephAvailable, pages, t]);

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
      rest.history.push(`${location.pathname}/overview/${defaultDashboard.current}`);
    } else if (location.pathname.endsWith('overview')) {
      rest.history.push(`${location.pathname}/${defaultDashboard.current}`);
    } else if (defaultDashboard.current !== dashboardTab) {
      const pathname = location.pathname.substring(0, location.pathname.lastIndexOf('/overview'));
      rest.history.push(`${pathname}/overview/${dashboardTab}`);
      defaultDashboard.current = dashboardTab;
    }
  }, [rest.history, location.pathname, systemName, dashboardTab]);

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
