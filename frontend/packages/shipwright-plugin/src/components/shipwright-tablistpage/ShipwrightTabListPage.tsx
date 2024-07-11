import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { DefaultPage } from '@console/internal/components/default-resource';
import { Page } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { MenuActions, MultiTabListPage } from '@console/shared';
import {
  BuildModel,
  BuildModelV1Alpha1,
  BuildRunModel,
  BuildRunModelV1Alpha1,
  BuildStrategyModel,
  BuildStrategyModelV1Alpha1,
  ClusterBuildStrategyModel,
  ClusterBuildStrategyModelV1Alpha1,
} from '../../models';
import { useDetermineModelVersion } from '../../utils';
import BuildListPage from '../build-list/BuildListPage';
import BuildRunListPage from '../buildrun-list/BuildRunListPage';

const commonPageProps = {
  showTitle: false,
  canCreate: false,
  hideBadge: true,
};

const buildListTab: Page = {
  href: 'builds',
  component: BuildListPage,
  nameKey: 'shipwright-plugin~Builds',
  pageData: commonPageProps,
};

const buildRunListTab: Page = {
  href: 'build-runs',
  component: BuildRunListPage,
  nameKey: 'shipwright-plugin~BuildRuns',
  pageData: commonPageProps,
};

const buildStrategyTab = (model: K8sModel): Page => {
  return {
    href: 'build-strategies',
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
    href: 'cluster-build-strategies',
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

  const buildModel = useDetermineModelVersion(
    BuildModel,
    BuildModelV1Alpha1,
    'SHIPWRIGHT_BUILD',
    'SHIPWRIGHT_BUILD_V1ALPHA1',
  );
  const buildRunModel = useDetermineModelVersion(
    BuildRunModel,
    BuildRunModelV1Alpha1,
    'SHIPWRIGHT_BUILDRUN',
    'SHIPWRIGHT_BUILDRUN_V1ALPHA1',
  );
  const buildStrategyModel = useDetermineModelVersion(
    BuildStrategyModel,
    BuildStrategyModelV1Alpha1,
    'SHIPWRIGHT_BUILDSTRATEGY',
    'SHIPWRIGHT_BUILDSTRATEGY_V1ALPHA1',
  );
  const clusterBuildStrategyModel = useDetermineModelVersion(
    ClusterBuildStrategyModel,
    ClusterBuildStrategyModelV1Alpha1,
    'SHIPWRIGHT_CLUSTERBUILDSTRATEGY',
    'SHIPWRIGHT_CLUSTERBUILDSTRATEGY_V1ALPHA1',
  );

  /* Use feature flags to determine which pages to show */
  const pages: Page[] = [];
  const menuActions: MenuActions = {};

  if (buildModel) {
    pages.push(buildListTab);
    menuActions.build = {
      model: buildModel,
      label: t('shipwright-plugin~Build'),
    };
  }

  if (buildRunModel) {
    pages.push(buildRunListTab);
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
      navigate('build-runs');
    } else if (buildStrategyModel) {
      navigate('build-strategies');
    } else if (clusterBuildStrategyModel) {
      navigate('cluster-build-strategies');
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
