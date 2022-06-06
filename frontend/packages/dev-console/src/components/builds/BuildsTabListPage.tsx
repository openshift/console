import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import {
  ResourceListPage as DynamicResourceListPage,
  isResourceListPage as isDynamicResourceListPage,
} from '@console/dynamic-plugin-sdk';
import { getResourceListPages } from '@console/internal/components/resource-pages';
import { withStartGuide } from '@console/internal/components/start-guide';
import { Page, AsyncComponent } from '@console/internal/components/utils';
import { useExtensions, isResourceListPage, ResourceListPage } from '@console/plugin-sdk';
import { useFlag, MenuActions, MultiTabListPage, getBadgeFromType } from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage from '../projects/CreateProjectListPage';

interface ServingListPageProps {
  match: Rmatch<{ ns: string }>;
}

const useResourceListPages = () => {
  const resourceListPageExtensions = useExtensions<ResourceListPage>(isResourceListPage);
  const dynamicResourceListPageExtensions = useExtensions<DynamicResourceListPage>(
    isDynamicResourceListPage,
  );
  return React.useMemo(
    () => getResourceListPages(resourceListPageExtensions, dynamicResourceListPageExtensions),
    [resourceListPageExtensions, dynamicResourceListPageExtensions],
  );
};

const BuildsTabListPage: React.FC<ServingListPageProps> = ({ match }) => {
  const namespace = match.params.ns;

  const { t } = useTranslation();

  const resourceListPages = useResourceListPages();

  const title = t('devconsole~Builds');

  const menuActions: MenuActions = {};
  const pages: Page[] = [];

  const extraProps = {
    showTitle: false,
    canCreate: false,
    match,
  };

  // BuildConfigs
  const buildConfigLoader = resourceListPages.get('build.openshift.io~v1~BuildConfig');
  if (buildConfigLoader) {
    menuActions.buildConfig = {
      label: t('devconsole~BuildConfig'),
      onSelection: () => `/k8s/ns/${namespace}/buildconfigs/~new`,
    };
    pages.push({
      href: '',
      name: t('devconsole~BuildConfigs'),
      component: () => <AsyncComponent loader={buildConfigLoader} {...extraProps} />,
    });
  }

  // We might add a generic extension for multi tab list pages in the future.
  // Currently we just check if Shipwright is installed and load a (dynamic) resource list page.
  const shipwrightBuildSupported = useFlag('SHIPWRIGHT_BUILD');
  const shipwrightBuildLoader = resourceListPages.get('shipwright.io~v1alpha1~Build');
  const [shipwrightBuildModel] = useK8sModel('shipwright.io~v1alpha1~Build');
  const shipwrightBadge = shipwrightBuildModel && getBadgeFromType(shipwrightBuildModel.badge);
  if (shipwrightBuildSupported && shipwrightBuildLoader) {
    menuActions.shipwrightBuild = {
      label: t('devconsole~Shipwright Build'),
      onSelection: () => `/k8s/ns/${namespace}/shipwright.io~v1alpha1~Build/~new`,
    };
    pages.push({
      href: 'shipwright-builds',
      name: t('devconsole~Shipwright Builds'),
      component: () => (
        <AsyncComponent loader={shipwrightBuildLoader} {...extraProps} badge={shipwrightBadge} />
      ),
    });
  }

  if (!match.params.ns) {
    return (
      <CreateProjectListPage title={title}>
        {(openProjectModal) => (
          <Trans t={t} ns="devconsole">
            Select a Project to view the list of builds or{' '}
            <Button isInline variant="link" onClick={openProjectModal}>
              create a Project
            </Button>
            .
          </Trans>
        )}
      </CreateProjectListPage>
    );
  }

  if (buildConfigLoader && pages.length === 1) {
    return (
      <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
        <AsyncComponent loader={buildConfigLoader} match={match} />
      </NamespacedPage>
    );
  }

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <MultiTabListPage
        title={title}
        pages={pages}
        match={match}
        menuActions={menuActions}
        // createRedirect
      />
    </NamespacedPage>
  );
};

export default withStartGuide(BuildsTabListPage);
