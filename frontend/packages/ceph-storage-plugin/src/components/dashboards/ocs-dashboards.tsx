import * as React from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import {
  useExtensions,
  DashboardsCard,
  DashboardsTab,
  isDashboardsCard,
  isDashboardsTab,
} from '@console/plugin-sdk';
import {
  DashboardsCard as DynamicDashboardsCard,
  DashboardsTab as DynamicDashboardsTab,
  isDashboardsCard as isDynamicDashboardsCard,
  isDashboardsTab as isDynamicDashboardsTab,
} from '@console/dynamic-plugin-sdk';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  getPluginTabPages,
  mapStateToProps,
  DashboardsPageProps,
} from '@console/internal/components/dashboard/dashboards-page/dashboards';
import { HorizontalNav, PageHeading, LoadingBox } from '@console/internal/components/utils';
import { OCS_INDEPENDENT_FLAG, MCG_FLAG, CEPH_FLAG } from '../../features';

const OCSDashboardsPage: React.FC<DashboardsPageProps> = ({ match, kindsInFlight, k8sModels }) => {
  const { t } = useTranslation();
  const title = t('ceph-storage-plugin~OpenShift Container Storage Overview');
  const isIndependent = useFlag(OCS_INDEPENDENT_FLAG);
  const isObjectServiceAvailable = useFlag(MCG_FLAG);
  const isCephAvailable = useFlag(CEPH_FLAG);
  const tabExtensions = useExtensions<DashboardsTab>(isDashboardsTab);
  const cardExtensions = useExtensions<DashboardsCard>(isDashboardsCard);
  const dynamicTabExtensions = useExtensions<DynamicDashboardsTab>(isDynamicDashboardsTab);
  const dynamicCardExtensions = useExtensions<DynamicDashboardsCard>(isDynamicDashboardsCard);
  const firstTabId =
    isIndependent && isCephAvailable
      ? 'independent-dashboard'
      : isObjectServiceAvailable && !isCephAvailable
      ? 'object-service'
      : 'persistent-storage';

  const pluginPages = React.useMemo(
    () =>
      getPluginTabPages(
        [...tabExtensions, ...dynamicTabExtensions],
        cardExtensions,
        dynamicCardExtensions,
        'storage',
        firstTabId,
      ),
    [tabExtensions, dynamicTabExtensions, cardExtensions, dynamicCardExtensions, firstTabId],
  );

  return kindsInFlight && k8sModels.size === 0 ? (
    <LoadingBox />
  ) : (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} detail />
      <HorizontalNav match={match} pages={pluginPages} noStatusBox />
    </>
  );
};

export const DashboardsPage = connect(mapStateToProps)(OCSDashboardsPage);
