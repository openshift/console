import * as React from 'react';
import { Badge } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useFlag } from '@console/dynamic-plugin-sdk/src/lib-core';
import { Page } from '@console/internal/components/utils';
import { MultiTabListPage, MenuActions } from '@console/shared';
import { BuildModel, BuildModelV1Alpha1, BuildRunModel, BuildRunModelV1Alpha1 } from '../../models';
import BuildListPage from '../build-list/BuildListPage';
import BuildRunListPage from '../buildrun-list/BuildRunListPage';
// import { RowFilter } from '@console/internal/components/filter-toolbar';
// import { referenceForModel } from '@console/internal/module/k8s';
// import { BuildRunModel, BuildRunModelV1Alpha1 } from '../../models';
// import { BuildRun, ComputedBuildRunStatus } from '../../types';
// import { getBuildRunStatus } from '../buildrun-status/BuildRunStatus';

const FillerComponent = (props) => {
  return <>{JSON.stringify(props)}</>;
};

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

const ShipwrightTabListPage: React.FC = () => {
  const { t } = useTranslation();
  const menuActions: MenuActions = {};
  const pages: Page[] = [];

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

  pages.push({
    href: 'buildstrategy',
    component: FillerComponent,
    nameKey: 'shipwright-plugin~BuildStrategy',
  });

  pages.push({
    href: 'clusterbuildstrategy',
    component: FillerComponent,
    nameKey: 'shipwright-plugin~ClusterBuildStrategy',
  });

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
