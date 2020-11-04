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
import {
  useExtensions,
  DashboardsCard,
  DashboardsTab,
  isDashboardsCard,
  isDashboardsTab,
} from '@console/plugin-sdk';
import { RootState } from '../../../redux';
import QuickStartBadge from './quick-start-badge';

const getCardsOnPosition = (cards: DashboardsCard[], position: GridPosition): GridDashboardCard[] =>
  cards
    .filter((c) => c.properties.position === position)
    .map((c) => ({
      Card: () => <AsyncComponent loader={c.properties.loader} />,
      span: c.properties.span,
    }));

const getPluginTabPages = (tabs: DashboardsTab[], cards: DashboardsCard[]): Page[] =>
  tabs.map((tab) => {
    const tabCards = cards.filter((c) => c.properties.tab === tab.properties.id);
    return {
      href: tab.properties.id,
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

const DashboardsPage_: React.FC<DashboardsPageProps> = ({ match, kindsInFlight, k8sModels }) => {
  const { t } = useTranslation();
  const title = t('dashboard~Overview');
  const tabExtensions = useExtensions<DashboardsTab>(isDashboardsTab);
  const cardExtensions = useExtensions<DashboardsCard>(isDashboardsCard);

  const pluginPages = React.useMemo(() => getPluginTabPages(tabExtensions, cardExtensions), [
    tabExtensions,
    cardExtensions,
  ]);

  const allPages = React.useMemo(
    () => [
      {
        href: '',
        name: t('dashboard~Cluster'),
        component: ClusterDashboard,
      },
      ...pluginPages,
    ],
    [pluginPages, t],
  );

  return kindsInFlight && k8sModels.size === 0 ? (
    <LoadingBox />
  ) : (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} detail={true} badge={<QuickStartBadge />} />
      <HorizontalNav match={match} pages={allPages} noStatusBox />
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']),
  k8sModels: state.k8s.getIn(['RESOURCES', 'models']),
});

export const DashboardsPage = connect(mapStateToProps)(DashboardsPage_);

type DashboardsPageProps = RouteComponentProps & {
  kindsInFlight: boolean;
  k8sModels: ImmutableMap<string, any>;
};
