import * as React from 'react';
import { Badge } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import { useFlag } from '@console/dynamic-plugin-sdk/src/lib-core';
import { DefaultPage } from '@console/internal/components/default-resource';
import { Page } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { MenuActions, MultiTabListPage, useUserSettings } from '@console/shared';
import { LAST_SHIPWRIGHT_PAGE_TAB_STORAGE_KEY } from '../../const';
import {
  BuildModelV1Alpha1,
  BuildRunModelV1Alpha1,
  ClusterBuildStrategyModel,
  BuildStrategyModel,
  BuildModel,
  BuildRunModel,
} from '../../models';
import BuildListPage from '../build-list/BuildListPage';
import BuildRunListPage from '../buildrun-list/BuildRunListPage';

const buildListPage: Page = {
  href: 'build',
  component: BuildListPage,
  nameKey: 'shipwright-plugin~Shipwright Builds',
};

const buildRunListPage: Page = {
  href: 'buildrun',
  component: BuildRunListPage,
  nameKey: 'shipwright-plugin~Shipwright BuildRuns',
};

const clusterBuildStrategyPage: Page = {
  href: 'clusterbuildstrategy',
  component: DefaultPage,
  nameKey: ClusterBuildStrategyModel.labelPluralKey,
  pageData: {
    kind: referenceForModel(ClusterBuildStrategyModel),
    autoFocus: true,
    showTitle: false,
    canCreate: false,
    hideBadge: true,
  },
};

const BuildStrategyPage: Page = {
  href: 'buildstrategy',
  component: DefaultPage,
  nameKey: BuildStrategyModel.labelPluralKey,
  pageData: {
    kind: referenceForModel(BuildStrategyModel),
    autoFocus: true,
    showTitle: false,
    canCreate: false,
    hideBadge: true,
  },
};

const ShipwrightTabListPage: React.FC = () => {
  const { t } = useTranslation();
  const menuActions: MenuActions = {};
  const pages: Page[] = [];
  const navigate = useNavigate();
  const { '*': currentTab } = useParams();
  const [preferredTab, setPreferredTab, preferredTabLoaded] = useUserSettings<string>(
    LAST_SHIPWRIGHT_PAGE_TAB_STORAGE_KEY,
    'build',
  );

  /* Redirect to last visited tab */
  React.useEffect(() => {
    if (preferredTabLoaded && currentTab === '') {
      navigate(preferredTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredTabLoaded]);

  React.useEffect(() => {
    // update the preferred tab
    if (preferredTabLoaded && pages.some((page) => page.href === currentTab)) {
      setPreferredTab(currentTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, preferredTabLoaded]);

  if (useFlag('SHIPWRIGHT_BUILD')) {
    menuActions.build = {
      model: BuildModel,
      label: t('shipwright-plugin~Build'),
    };
    pages.includes(buildListPage) || pages.push(buildListPage);
  }

  if (useFlag('SHIPWRIGHT_BUILD_V1ALPHA1')) {
    menuActions.build = {
      model: BuildModelV1Alpha1,
      label: t('shipwright-plugin~Build'),
    };
    pages.includes(buildListPage) || pages.push(buildListPage);
  }

  if (useFlag('SHIPWRIGHT_BUILDRUN')) {
    menuActions.buildrun = {
      model: BuildRunModel,
      label: t('shipwright-plugin~BuildRun'),
    };
    pages.includes(buildRunListPage) || pages.push(buildRunListPage);
  }

  if (useFlag('SHIPWRIGHT_BUILDRUN_V1ALPHA1')) {
    menuActions.buildrun = {
      model: BuildRunModelV1Alpha1,
      label: t('shipwright-plugin~BuildRun'),
    };
    pages.includes(buildRunListPage) || pages.push(buildRunListPage);
  }

  menuActions.buildstrategy = {
    model: ClusterBuildStrategyModel,
    label: t('shipwright-plugin~BuildStrategy'),
  };

  pages.push(BuildStrategyPage);

  menuActions.clusterbuildstrategy = {
    model: ClusterBuildStrategyModel,
    label: t('shipwright-plugin~ClusterBuildStrategy'),
  };

  pages.push(clusterBuildStrategyPage);

  return (
    <MultiTabListPage
      title={t('shipwright-plugin~Shipwright')}
      pages={pages}
      badge={<Badge isRead>i am still working on it</Badge>}
      menuActions={menuActions}
      telemetryPrefix="Shipwright"
    />
  );
};

export default ShipwrightTabListPage;
