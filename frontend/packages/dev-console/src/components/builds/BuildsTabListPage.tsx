import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import { withStartGuide } from '@console/internal/components/start-guide';
import { Page, AsyncComponent } from '@console/internal/components/utils';
import {
  useFlag,
  MenuActions,
  MultiTabListPage,
  getBadgeFromType,
  useUserSettings,
} from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useResourceListPages } from '@console/shared/src/hooks/useResourceListPages';
import { LAST_BUILD_PAGE_TAB_STORAGE_KEY } from '../../const';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage, { CreateAProjectButton } from '../projects/CreateProjectListPage';

/**
 * We might add a generic extension for multi tab list pages in the future.
 * Currently we just check if some well known build (BuildConfigs and Shipwright Builds)
 * are available and load their (dynamic) resource list page.
 */
const BuildsTabListPage: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace, '*': currentTab } = useParams();
  const navigate = useNavigate();
  const title = t('devconsole~Builds');
  const menuActions: MenuActions = {};
  const pages: Page[] = [];
  const [preferredTab, setPreferredTab, preferredTabLoaded] = useUserSettings<string>(
    LAST_BUILD_PAGE_TAB_STORAGE_KEY,
    'shipwright-builds',
  );

  const resourceListPages = useResourceListPages();
  const extraProps = {
    showTitle: false,
    canCreate: false,
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
      onSelection: () => `/k8s/ns/${namespace}/buildconfigs/~new/form`,
    };
  }
  if (buildConfigComponent) {
    pages.push({
      href: '',
      // t('devconsole~BuildConfigs')
      nameKey: 'devconsole~BuildConfigs',
      component: buildConfigComponent,
      pageData: extraProps,
    });
  }

  // Shipwright Builds from @console/shipwright-plugin
  // We resolve this plugin (list) page by string, so that we don't have
  // a bi-directional or circular dependency to the shipwright-plugin.
  const SHIPWRIGHT_BUILD = useFlag('SHIPWRIGHT_BUILD');
  const SHIPWRIGHT_BUILD_V1ALPHA1 = useFlag('SHIPWRIGHT_BUILD_V1ALPHA1');

  const shipwrightBuildEnabled = SHIPWRIGHT_BUILD || SHIPWRIGHT_BUILD_V1ALPHA1;

  /* Redirect to last visited tab */
  React.useEffect(() => {
    if (preferredTabLoaded && namespace) {
      if (preferredTab === 'shipwright-builds' && shipwrightBuildEnabled) {
        navigate(`/builds/ns/${namespace}/shipwright-builds`, { replace: true });
      } else {
        navigate(`/builds/ns/${namespace}`, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, preferredTabLoaded]);

  React.useEffect(() => {
    // update the preferred tab
    if (preferredTabLoaded && namespace) {
      setPreferredTab(currentTab === 'shipwright-builds' ? 'shipwright-builds' : 'buildconfigs');
    }
  }, [namespace, currentTab, preferredTabLoaded, setPreferredTab]);

  const shipwrightKind = SHIPWRIGHT_BUILD
    ? 'shipwright.io~v1beta1~Build'
    : 'shipwright.io~v1alpha1~Build';
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
      // t('devconsole~Shipwright Builds')
      nameKey: 'devconsole~Shipwright Builds',
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
        <AsyncComponent loader={buildConfigLoader} />
      </NamespacedPage>
    );
  }

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications>
      <MultiTabListPage
        title={title}
        pages={pages}
        menuActions={menuActions}
        telemetryPrefix="Builds"
      />
    </NamespacedPage>
  );
};

export default withStartGuide(BuildsTabListPage);
