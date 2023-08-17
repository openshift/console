import * as React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom-v5-compat';
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
import { MCG_FLAG, CEPH_FLAG, OCS_INDEPENDENT_FLAG } from '../../features';

type ODFSystemDashboardPageProps = Omit<DashboardsPageProps, 'match'>;

const blockPoolRef = referenceForModel(CephBlockPoolModel);

const ODFSystemDashboard: React.FC<ODFSystemDashboardPageProps> = ({
  kindsInFlight,
  k8sModels,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isObjectServiceAvailable = useFlag(MCG_FLAG);
  const isCephAvailable = useFlag(CEPH_FLAG);
  const params = useParams();
  const { systemName } = params;
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

  const isExternal = useFlag(OCS_INDEPENDENT_FLAG);

  React.useEffect(() => {
    const isBlockPoolAdded = pages.find((page) => page.href === blockPoolRef);
    if (isCephAvailable && !isBlockPoolAdded && !isExternal) {
      setPages([
        ...pages,
        {
          href: blockPoolRef,
          name: t('ceph-storage-plugin~BlockPools'),
          component: () => <BlockPoolListPage namespace={CEPH_STORAGE_NAMESPACE} />,
        },
      ]);
    }
    if (isBlockPoolAdded && isExternal) {
      setPages((p) => p.filter((page) => page.href !== blockPoolRef));
    }
  }, [isExternal, isCephAvailable, pages, t]);

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

  const title = params.systemName;

  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname.endsWith(systemName)) {
      navigate(`${location.pathname}/overview/${defaultDashboard.current}`);
    } else if (location.pathname.endsWith('overview')) {
      navigate(`${location.pathname}/${defaultDashboard.current}`);
    } else if (defaultDashboard.current !== dashboardTab) {
      const pathname = location.pathname.substring(0, location.pathname.lastIndexOf('/overview'));
      navigate(`${pathname}/overview/${dashboardTab}`);
      defaultDashboard.current = dashboardTab;
    }
  }, [navigate, location.pathname, systemName, dashboardTab]);

  return kindsInFlight && k8sModels.size === 0 ? (
    <LoadingBox />
  ) : (
    <>
      <PageHeading title={title} breadcrumbs={breadcrumbs} detail />
      <HorizontalNav pages={pages} noStatusBox />
    </>
  );
};

export default connect(mapStateToProps)(ODFSystemDashboard);
