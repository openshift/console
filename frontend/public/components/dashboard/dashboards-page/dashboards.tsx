import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';

import { ClusterDashboard } from './cluster-dashboard/cluster-dashboard';
import { HorizontalNav, PageHeading, LoadingBox, Page, AsyncComponent } from '../../utils';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid, {
  GridPosition,
  GridDashboardCard,
} from '@console/shared/src/components/dashboard/DashboardGrid';
import { RestoreGettingStartedButton } from '@console/shared/src/components/getting-started';
import {
  useExtensions,
  DashboardsCard,
  DashboardsTab,
  isDashboardsCard,
  isDashboardsTab,
} from '@console/plugin-sdk';
import { RootState } from '../../../redux';
import { USER_SETTINGS_KEY } from './cluster-dashboard/getting-started/constants';

export const getCardsOnPosition = (
  cards: DashboardsCard[],
  position: GridPosition,
): GridDashboardCard[] =>
  cards
    .filter((c) => c.properties.position === position)
    .map((c) => ({
      Card: () => <AsyncComponent loader={c.properties.loader} />,
      span: c.properties.span,
    }));

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

const DashboardsPage_: React.FC<DashboardsPageProps> = ({ match, kindsInFlight, k8sModels }) => {
  const { t } = useTranslation();
  const title = t('public~Overview');
  const tabExtensions = useExtensions<DashboardsTab>(isDashboardsTab);
  const cardExtensions = useExtensions<DashboardsCard>(isDashboardsCard);

  const pluginPages = React.useMemo(
    () => getPluginTabPages(tabExtensions, cardExtensions, 'home', ''),
    [tabExtensions, cardExtensions],
  );

  const allPages: Page[] = React.useMemo(
    () => [
      {
        href: '',
        name: t('public~Cluster'),
        component: ClusterDashboard,
        badge: <RestoreGettingStartedButton userSettingsKey={USER_SETTINGS_KEY} />,
      },
      ...pluginPages,
    ],
    [pluginPages, t],
  );

  const badge = React.useMemo(
    () => allPages.find((page) => `/dashboards${page.href}` === match.path)?.badge,
    [allPages, match],
  );

  return kindsInFlight && k8sModels.size === 0 ? (
    <LoadingBox />
  ) : (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} detail={true} badge={badge} />
      <HorizontalNav match={match} pages={allPages} noStatusBox />
    </>
  );
};

export const mapStateToProps = (state: RootState) => ({
  kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']),
  k8sModels: state.k8s.getIn(['RESOURCES', 'models']),
});

export const DashboardsPage = connect(mapStateToProps)(DashboardsPage_);

export type DashboardsPageProps = RouteComponentProps & {
  kindsInFlight: boolean;
  k8sModels: ImmutableMap<string, any>;
};
