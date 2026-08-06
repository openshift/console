import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import type { DashboardsCard, DashboardsTab, OverviewGridCard } from '@console/dynamic-plugin-sdk';
import { isDashboardsCard, isDashboardsTab, GridPosition } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import type { RootState } from '../../../redux';
import { AsyncComponent } from '../../utils/async';
import { HorizontalNav } from '../../utils/horizontal-nav';
import type { Page } from '../../utils/horizontal-nav';
import { LoadingBox } from '../../utils/status-box';
import { ClusterDashboard } from './cluster-dashboard/cluster-dashboard';

const getCardsOnPosition = (
  cards: DashboardsCard[],
  position: GridPosition,
): OverviewGridCard[] => [
  ...cards
    .filter((c) => c.properties.position === position)
    .map((c) => ({
      Card: () => <AsyncComponent loader={c.properties.component} />,
      span: c.properties.span,
    })),
];

const getPluginTabPages = (
  tabs: DashboardsTab[],
  cards: DashboardsCard[],
  navSection: string,
  firstTabId: string,
): Page[] => {
  const filteredTabs = tabs.filter((t) => t.properties.navSection === navSection);
  return filteredTabs.map((tab) => {
    const tabCards = cards.filter((c) => c.properties.tab === tab.properties.id);
    return {
      href: tab.properties.id === firstTabId ? '' : tab.properties.id,
      name: tab.properties.title,
      component: () => (
        <Dashboard>
          <DashboardGrid
            mainCards={getCardsOnPosition(tabCards, GridPosition.MAIN)}
            leftCards={getCardsOnPosition(tabCards, GridPosition.LEFT)}
            rightCards={getCardsOnPosition(tabCards, GridPosition.RIGHT)}
          />
        </Dashboard>
      ),
    };
  });
};

const InnerDashboardsPage: FC<DashboardsPageProps> = ({ kindsInFlight, k8sModelsLoaded }) => {
  const { t } = useTranslation('public');
  const title = t('Overview');
  const tabExtensions = useExtensions<DashboardsTab>(isDashboardsTab);
  const cardExtensions = useExtensions<DashboardsCard>(isDashboardsCard);

  const location = useLocation();

  const pluginPages = useMemo(
    () => getPluginTabPages(tabExtensions, cardExtensions, 'home', ''),
    [tabExtensions, cardExtensions],
  );

  const allPages: Page[] = useMemo(
    () => [
      {
        href: '',
        // t('public~Cluster')
        nameKey: 'public~Cluster',
        component: ClusterDashboard,
      },
      ...pluginPages,
    ],
    [pluginPages],
  );

  const badge = useMemo(
    () => allPages.find((page) => `/dashboards${page.href}` === location.pathname)?.badge,
    [allPages, location.pathname],
  );
  const titleProviderValues = {
    telemetryPrefix: 'Overview',
    titlePrefix: title,
  };

  return kindsInFlight && !k8sModelsLoaded ? (
    <LoadingBox />
  ) : (
    <>
      <PageTitleContext.Provider value={titleProviderValues}>
        <PageHeading title={title} badge={badge} />
        <HorizontalNav pages={allPages} noStatusBox />
      </PageTitleContext.Provider>
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']),
  k8sModelsLoaded: state.k8s.getIn(['RESOURCES', 'loaded']),
});

export const DashboardsPage = connect(mapStateToProps)(InnerDashboardsPage);

export type DashboardsPageProps = {
  kindsInFlight: boolean;
  k8sModelsLoaded: boolean;
};
