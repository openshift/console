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
import { useFlag } from '@console/shared/src/hooks/flag';
import { OCS_INDEPENDENT_FLAG, OCS_FLAG } from '../../features';

const OCSDashboardsPage: React.FC<DashboardsPageProps> = ({ match, kindsInFlight, k8sModels }) => {
  const { t } = useTranslation();
  const title = t('ceph-storage-plugin~OpenShift Container Storage Overview');
  const tabExtensions = useExtensions<DashboardsTab>(isDashboardsTab);
  const cardExtensions = useExtensions<DashboardsCard>(isDashboardsCard);
  const dynamicTabExtensions = useExtensions<DynamicDashboardsTab>(isDynamicDashboardsTab);
  const dynamicCardExtensions = useExtensions<DynamicDashboardsCard>(isDynamicDashboardsCard);

  const isExternalOcs = useFlag(OCS_INDEPENDENT_FLAG);
  const isInternallOcs = useFlag(OCS_FLAG);

  const pluginPages = React.useMemo(() => {
    const allTabs: (DashboardsTab | DynamicDashboardsTab)[] = [
      ...tabExtensions,
      ...dynamicTabExtensions,
    ];
    /** firstTabId === 'independent-dashboard', if it is an external mode OCS cluster.
     *  firstTabId === 'persistent-storage', if it is not an external mode OCS cluster (internal mode).
     *  firstTabId === 'object-service', if NooBaaSystem is there, but, StorageCluster is not.
     */
    const firstTabId: string = isExternalOcs
      ? 'independent-dashboard'
      : isInternallOcs
      ? 'persistent-storage'
      : 'object-service';
    return getPluginTabPages(allTabs, cardExtensions, dynamicCardExtensions, 'storage', firstTabId);
  }, [
    tabExtensions,
    dynamicTabExtensions,
    isExternalOcs,
    isInternallOcs,
    cardExtensions,
    dynamicCardExtensions,
  ]);

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
