// Disabling as default imports from multiple files have same names
/* eslint-disable import/no-named-default */
/**
 * Dashboard that is injected to ODF Extension Point
 * TODO(bipuladh) Add this to ODF Extension Point once it's ready
 */

import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  DashboardsPageProps,
  mapStateToProps,
} from '@console/internal/components/dashboard/dashboards-page/dashboards';
import { Page, HorizontalNav, LoadingBox, PageHeading } from '@console/internal/components/utils';
import DashboardGrid, {
  GridDashboardCard,
} from '@console/shared/src/components/dashboard/DashboardGrid';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import { useFlag } from '@console/shared/src/hooks/flag';
import { default as StatusCard } from './persistent-internal/status-card/status-card';
import RawCapacityCard from './persistent-internal/raw-capacity-card/raw-capacity-card';
import BreakdownCard from './persistent-internal/capacity-breakdown-card/capacity-breakdown-card';
import UtilizationCard from './persistent-internal/utilization-card/utilization-card';
import { default as ActivityCard } from './persistent-internal/activity-card/activity-card';
import DetailsCard from './persistent-internal/details-card';
import InventoryCard from './persistent-internal/inventory-card';
import storageEfficiencyCard from './persistent-internal/storage-efficiency-card/storage-efficiency-card';
import { StatusCard as ExtStatusCard } from './persistent-external/status-card';
import { default as ExtBreakdownCard } from './persistent-external/breakdown-card';
import { default as ObjectStatusCard } from './object-service/status-card/status-card';
import { default as ExtUtilizationCard } from './persistent-external/utilization-card';
import { default as ExtDetailsCard } from './persistent-external/details-card';
import { DetailsCard as ObjectDetailsCard } from './object-service/details-card/details-card';
import StorageEfficiencyCard from './object-service/storage-efficiency-card/storage-efficiency-card';
import { BucketsCard } from './object-service/buckets-card/buckets-card';
import { default as ObjectBreakdownCard } from './object-service/capacity-breakdown/capacity-breakdown-card';
import DataConsumptionCard from './object-service/data-consumption-card/data-consumption-card';
import { default as ObjectActivityCard } from './object-service/activity-card/activity-card';
import { ResourceProvidersCard } from './object-service/resource-providers-card/resource-providers-card';
import { OCS_INDEPENDENT_FLAG, MCG_FLAG, CEPH_FLAG } from '../../features';

const convertToCard = (Card: React.ComponentType): GridDashboardCard => ({ Card });

const isPagePresent = (pages: Page[], page: Page): boolean =>
  pages.some((p) => page.href === p.href);

export const BLOCK_FILE = 'block-file';
export const OBJECT = 'object';

const sortPages = (a: Page, b: Page): number => {
  if (a.href === BLOCK_FILE || a.href === `overview/${BLOCK_FILE}`) return -1;
  if (b.href === OBJECT || a.href === `overview/${OBJECT}`) return 1;
  return 0;
};

type CommonDashboardRendererProps = {
  leftCards: React.ComponentType[];
  rightCards: React.ComponentType[];
  mainCards: React.ComponentType[];
};

const CommonDashboardRenderer: React.FC<CommonDashboardRendererProps> = ({
  leftCards,
  rightCards,
  mainCards,
}) => {
  const mainGridCards: GridDashboardCard[] = mainCards.map(convertToCard);
  const leftGridCards: GridDashboardCard[] = leftCards.map(convertToCard);
  const rightGridCards: GridDashboardCard[] = rightCards.map(convertToCard);

  return (
    <Dashboard>
      <DashboardGrid
        mainCards={mainGridCards}
        leftCards={leftGridCards}
        rightCards={rightGridCards}
      />
    </Dashboard>
  );
};

const PersistentInternalDashboard: React.FC = () => {
  const mainCards: React.ComponentType[] = [
    StatusCard,
    RawCapacityCard,
    BreakdownCard,
    UtilizationCard,
  ];
  const leftCards: React.ComponentType[] = [DetailsCard, InventoryCard, storageEfficiencyCard];
  const rightCards: React.ComponentType[] = [ActivityCard];

  return (
    <CommonDashboardRenderer leftCards={leftCards} mainCards={mainCards} rightCards={rightCards} />
  );
};

const PersistentExternalDashboard: React.FC = () => {
  const mainCards: React.ComponentType[] = [ExtStatusCard, ExtBreakdownCard, ExtUtilizationCard];
  const leftCards: React.ComponentType[] = [ExtDetailsCard, InventoryCard];
  const rightCards: React.ComponentType[] = [ActivityCard];

  return (
    <CommonDashboardRenderer leftCards={leftCards} mainCards={mainCards} rightCards={rightCards} />
  );
};

const ObjectServiceDashboard: React.FC = () => {
  const mainCards: React.ComponentType[] = [
    ObjectStatusCard,
    ObjectBreakdownCard,
    DataConsumptionCard,
  ];
  const leftCards: React.ComponentType[] = [
    ObjectDetailsCard,
    StorageEfficiencyCard,
    BucketsCard,
    ResourceProvidersCard,
  ];
  const rightCards: React.ComponentType[] = [ObjectActivityCard];
  return (
    <CommonDashboardRenderer leftCards={leftCards} mainCards={mainCards} rightCards={rightCards} />
  );
};

const OCSSystemDashboard: React.FC<DashboardsPageProps> = ({
  match,
  kindsInFlight,
  k8sModels,
  history,
}) => {
  const isIndependent = useFlag(OCS_INDEPENDENT_FLAG);
  const isObjectServiceAvailable = useFlag(MCG_FLAG);
  const isCephAvailable = useFlag(CEPH_FLAG);
  const [pages, setPages] = React.useState<Page[]>([]);
  const { t } = useTranslation();
  const title = t('ceph-storage-plugin~OpenShift Container Storage Overview');

  const location = useLocation();

  const isOCS = location.pathname.includes('ocs-dashboards');

  const showInternalDashboard = !isIndependent && isCephAvailable;

  const internalPage = React.useMemo(() => {
    return {
      href: !isOCS ? `overview/${BLOCK_FILE}` : BLOCK_FILE,
      name: t('ceph-storage-plugin~Block and File'),
      component: PersistentInternalDashboard,
    };
  }, [isOCS, t]);
  const externalPage = React.useMemo(() => {
    return {
      href: !isOCS ? `overview/${BLOCK_FILE}` : BLOCK_FILE,
      name: t('ceph-storage-plugin~Block and File'),
      component: PersistentExternalDashboard,
    };
  }, [isOCS, t]);
  const objectPage = React.useMemo(() => {
    return {
      href: !isOCS ? `overview/${OBJECT}` : OBJECT,
      name: t('ceph-storage-plugin~Object'),
      component: ObjectServiceDashboard,
    };
  }, [isOCS, t]);

  React.useEffect(() => {
    if (showInternalDashboard && !isPagePresent(pages, internalPage)) {
      const tempPages = [...pages, internalPage];
      const sortedPages = tempPages.sort(sortPages);
      setPages(sortedPages);
    }
    if (isIndependent && !isPagePresent(pages, externalPage)) {
      const tempPages = [...pages, externalPage];
      const sortedPages = tempPages.sort(sortPages);
      setPages(sortedPages);
    }
  }, [pages, showInternalDashboard, isIndependent, internalPage, externalPage]);

  React.useEffect(() => {
    if (isObjectServiceAvailable && !isPagePresent(pages, objectPage)) {
      const tempPages = [...pages, objectPage];
      const sortedPages = tempPages.sort(sortPages);
      setPages(sortedPages);
    }
  }, [pages, isObjectServiceAvailable, objectPage]);

  React.useEffect(() => {
    if (!location.pathname.includes(BLOCK_FILE) && !location.pathname.includes(OBJECT)) {
      if (isCephAvailable === true) {
        history.push(`${match.url}/${BLOCK_FILE}`);
      } else if (isCephAvailable === false && isObjectServiceAvailable) {
        history.push(`${match.url}/${OBJECT}`);
      }
    }
  }, [isCephAvailable, isObjectServiceAvailable, history, match.url, location.pathname]);

  return kindsInFlight && k8sModels.size === 0 ? (
    <LoadingBox />
  ) : (
    <>
      {isOCS && <Helmet>{title}</Helmet>}
      {isOCS && <PageHeading title={title} detail />}
      <HorizontalNav match={match} pages={pages} noStatusBox />
    </>
  );
};

export default connect(mapStateToProps)(OCSSystemDashboard);
