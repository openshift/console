import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { DefaultPage } from '@console/internal/components/default-resource';
import { Page } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { MenuAction, MenuActions, MultiTabListPage } from '@console/shared';
import {
  useBuildModel,
  useBuildRunModel,
  useBuildStrategyModel,
  useClusterBuildStrategyModel,
} from '../../utils';
import BuildListPage from '../build-list/BuildListPage';
import BuildRunListPage from '../buildrun-list/BuildRunListPage';

const commonPageProps = {
  showTitle: false,
  canCreate: false,
  hideBadge: true,
};

const buildListTab = (model: K8sModel): Page => {
  return {
    href: 'builds',
    component: BuildListPage,
    nameKey: 'shipwright-plugin~Builds',
    pageData: {
      ...commonPageProps,
      kind: referenceForModel(model),
    },
  };
};

const buildRunListTab = (model: K8sModel): Page => {
  return {
    href: 'buildruns',
    component: BuildRunListPage,
    nameKey: 'shipwright-plugin~BuildRuns',
    pageData: {
      ...commonPageProps,
      kind: referenceForModel(model),
    },
  };
};

const buildStrategyTab = (model: K8sModel): Page => {
  return {
    href: 'buildstrategies',
    component: DefaultPage,
    nameKey: 'shipwright-plugin~BuildStrategies',
    pageData: {
      ...commonPageProps,
      kind: referenceForModel(model),
    },
  };
};

const clusterBuildStrategyTab = (model: K8sModel): Page => {
  return {
    href: 'clusterbuildstrategies',
    component: DefaultPage,
    nameKey: 'shipwright-plugin~ClusterBuildStrategies',
    pageData: {
      ...commonPageProps,
      kind: referenceForModel(model),
    },
  };
};

const ShipwrightTabListPage: React.FC = () => {
  const { t } = useTranslation();
  const { '*': currentTab } = useParams();
  const navigate = useNavigate();

  const buildModel = useBuildModel();
  const buildRunModel = useBuildRunModel();
  const buildStrategyModel = useBuildStrategyModel();
  const clusterBuildStrategyModel = useClusterBuildStrategyModel();

  /* Use feature flags to determine which pages to show */
  const pages: Page[] = [];
  const menuActions: MenuActions = {};

  if (buildModel) {
    pages.push(buildListTab(buildModel));
    menuActions.build = {
      model: buildModel,
      label: t('shipwright-plugin~Build'),
      onSelection: (_key: string, _action: MenuAction, url: string) => `${url}/form`,
    };
  }

  if (buildRunModel) {
    pages.push(buildRunListTab(buildRunModel));
    menuActions.buildRun = {
      model: buildRunModel,
      label: t('shipwright-plugin~BuildRun'),
    };
  }

  if (buildStrategyModel) {
    pages.push(buildStrategyTab(buildStrategyModel));
    menuActions.buildStrategy = {
      model: buildStrategyModel,
      label: t('shipwright-plugin~BuildStrategy'),
    };
  }

  if (clusterBuildStrategyModel) {
    pages.push(clusterBuildStrategyTab(clusterBuildStrategyModel));
    menuActions.clusterBuildStrategy = {
      model: clusterBuildStrategyModel,
      label: t('shipwright-plugin~ClusterBuildStrategy'),
    };
  }

  /* Do not show empty page when no tab is selected */
  React.useEffect(() => {
    if (currentTab !== '') {
      return;
    }

    if (buildModel) {
      navigate('builds');
    } else if (buildRunModel) {
      navigate('buildruns');
    } else if (buildStrategyModel) {
      navigate('buildstrategies');
    } else if (clusterBuildStrategyModel) {
      navigate('clusterbuildstrategies');
    }
  }, [
    currentTab,
    navigate,
    buildModel,
    buildRunModel,
    buildStrategyModel,
    clusterBuildStrategyModel,
  ]);

  return (
    <MultiTabListPage
      title={t('shipwright-plugin~Shipwright')}
      pages={pages}
      menuActions={menuActions}
      telemetryPrefix="Shipwright"
    />
  );
};

export default ShipwrightTabListPage;
