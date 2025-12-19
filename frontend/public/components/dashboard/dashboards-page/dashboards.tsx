import type { FC } from 'react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import { useTranslation } from 'react-i18next';

import { ClusterDashboard } from './cluster-dashboard/cluster-dashboard';
import { HorizontalNav } from '../../utils/horizontal-nav';
import { LoadingBox } from '../../utils/status-box';
import type { Page } from '../../utils/horizontal-nav';
import { AsyncComponent } from '../../utils/async';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import {
  DashboardsCard,
  DashboardsTab,
  isDashboardsCard,
  isDashboardsTab,
  GridPosition,
  OverviewGridCard,
} from '@console/dynamic-plugin-sdk';
import { RootState } from '../../../redux';

export const getCardsOnPosition = (
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

export const getPluginTabPages = (
  tabs: DashboardsTab[],
  cards: DashboardsCard[],
  navSection: string,
  firstTabId: string,
): Page[] => {
  tabs = tabs.filter((t) => t.properties.navSection === navSection);
  return tabs.map((tab) => {
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

const DashboardsPage_: FC<DashboardsPageProps> = ({ kindsInFlight, k8sModels }) => {
  const { t } = useTranslation();
  const title = t('public~Overview');
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

  return kindsInFlight && k8sModels.size === 0 ? (
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

export const mapStateToProps = (state: RootState) => ({
  kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']),
  k8sModels: state.k8s.getIn(['RESOURCES', 'models']),
});

export const DashboardsPage = connect(mapStateToProps)(DashboardsPage_);

export type DashboardsPageProps = {
  kindsInFlight: boolean;
  k8sModels: ImmutableMap<string, any>;
};
