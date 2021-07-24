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
import {
  getPluginTabPages,
  mapStateToProps,
  DashboardsPageProps,
} from '@console/internal/components/dashboard/dashboards-page/dashboards';
import { HorizontalNav, PageHeading, LoadingBox } from '@console/internal/components/utils';

const OCSDashboardsPage: React.FC<DashboardsPageProps> = ({ match, kindsInFlight, k8sModels }) => {
  const { t } = useTranslation();
  const title = t('ceph-storage-plugin~OpenShift Data Foundation Overview');
  const tabExtensions = useExtensions<DashboardsTab>(isDashboardsTab);
  const cardExtensions = useExtensions<DashboardsCard>(isDashboardsCard);
  const dynamicTabExtensions = useExtensions<DynamicDashboardsTab>(isDynamicDashboardsTab);
  const dynamicCardExtensions = useExtensions<DynamicDashboardsCard>(isDynamicDashboardsCard);

  const pluginPages = React.useMemo(
    () =>
      getPluginTabPages(
        [...tabExtensions, ...dynamicTabExtensions],
        cardExtensions,
        dynamicCardExtensions,
        'storage',
        'persistent-storage',
      ),
    [tabExtensions, dynamicTabExtensions, cardExtensions, dynamicCardExtensions],
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
