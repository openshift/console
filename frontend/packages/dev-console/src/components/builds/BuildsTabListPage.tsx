import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import { withStartGuide } from '@console/internal/components/start-guide';
import { Page, AsyncComponent } from '@console/internal/components/utils';
import { useFlag, MenuActions, MultiTabListPage, getBadgeFromType } from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useResourceListPages } from '@console/shared/src/hooks/useResourceListPages';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';

interface BuildsTabListPageProps {
  match: Rmatch<{ ns?: string }>;
}

/**
 * We might add a generic extension for multi tab list pages in the future.
 * Currently we just check if some well known build (BuildConfigs and Shipwright Builds)
 * are available and load their (dynamic) resource list page.
 */
const BuildsTabListPage: React.FC<BuildsTabListPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const title = t('devconsole~Builds');
  const namespace = match.params.ns;
  const menuActions: MenuActions = {};
  const pages: Page[] = [];

  const resourceListPages = useResourceListPages();
  const extraProps = {
    showTitle: false,
    canCreate: false,
    match,
  };

  // BuildConfigs from @console/internal
  const buildConfigLoader = resourceListPages.get('build.openshift.io~v1~BuildConfig');
  const buildConfigComponent = React.useMemo(
    () =>
      buildConfigLoader
        ? (childProps) => (
            <AsyncComponent key="buildconfigs" loader={buildConfigLoader} {...childProps} />
          )
        : null,
    [buildConfigLoader],
  );
  if (namespace) {
    menuActions.buildConfig = {
      label: t('devconsole~BuildConfig'),
      onSelection: () => `/k8s/ns/${namespace}/buildconfigs/~new`,
    };
  }
  if (buildConfigComponent) {
    pages.push({
      href: '',
      name: t('devconsole~BuildConfigs'),
      component: buildConfigComponent,
      pageData: extraProps,
    });
  }

  // Shipwright Builds from @console/shipwright-plugin
  // We resolve this plugin (list) page by string, so that we don't have
  // a bi-directional or circular dependency to the shipwright-plugin.
  const shipwrightKind = 'shipwright.io~v1alpha1~Build';
  const shipwrightBuildEnabled = useFlag('SHIPWRIGHT_BUILD');
  const shipwrightBuildLoader = resourceListPages.get(shipwrightKind);
  const [shipwrightBuildModel] = useK8sModel(shipwrightKind);
  const shipwrightBuildComponent = React.useMemo(() => {
    return shipwrightBuildEnabled && shipwrightBuildLoader
      ? (childProps) => (
          <AsyncComponent
            key="shipwright-builds"
            loader={shipwrightBuildLoader}
            badge={getBadgeFromType(shipwrightBuildModel.badge)}
            {...childProps}
          />
        )
      : null;
  }, [shipwrightBuildEnabled, shipwrightBuildLoader, shipwrightBuildModel.badge]);
  if (namespace && shipwrightBuildComponent) {
    menuActions.shipwrightBuild = {
      label: t('devconsole~Shipwright Build'),
      onSelection: () => `/k8s/ns/${namespace}/${shipwrightKind}/~new`,
    };
    pages.push({
      href: 'shipwright-builds',
      name: t('devconsole~Shipwright Builds'),
      component: shipwrightBuildComponent,
      pageData: extraProps,
    });
  }

  if (!namespace) {
    return (
      <CreateProjectListPage title={title}>
        {(openProjectModal) => (
          <Trans t={t} ns="devconsole">
            Select a Project to view the list of builds
            <CreateAProjectButton openProjectModal={openProjectModal} />.
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
      <MultiTabListPage title={title} pages={pages} match={match} menuActions={menuActions} />
    </NamespacedPage>
  );
};

export default withStartGuide(BuildsTabListPage);
