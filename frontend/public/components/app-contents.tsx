import * as React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  useActivePerspective,
  Perspective,
  RoutePage as DynamicRoutePage,
  isRoutePage as isDynamicRoutePage,
} from '@console/dynamic-plugin-sdk';
import { useDynamicPluginInfo } from '@console/plugin-sdk/src/api/useDynamicPluginInfo';
import {
  FLAGS,
  useUserSettings,
  getPerspectiveVisitedKey,
  usePerspectives,
  CLUSTER_ROUTE_PREFIX,
} from '@console/shared';
import { ErrorBoundaryPage } from '@console/shared/src/components/error';
import { connectToFlags } from '../reducers/connectToFlags';
import { flagPending, FlagsObject } from '../reducers/features';
import { GlobalNotifications } from './global-notifications';
import { NamespaceBar } from './namespace-bar';
import { SearchPage } from './search';
import { ResourceDetailsPage, ResourceListPage } from './resource-list';
import { AsyncComponent, LoadingBox } from './utils';
import { namespacedPrefixes } from './utils/link';
import { AlertmanagerModel, CronJobModel, VolumeSnapshotModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { NamespaceRedirect } from './utils/namespace-redirect';
import { addPrefixToPaths } from '@console/shared/src/utils/paths';
import { PerspectiveRedirect } from '@console/app/src/components/detect-perspective/PerspectiveRedirect';

//PF4 Imports
import { PageSection, PageSectionVariants } from '@patternfly/react-core';
import { RoutePage, isRoutePage, useExtensions, LoadedExtension } from '@console/plugin-sdk';

import CreateResource from './create-resource';

// Ensure a *const* function wrapper for each namespaced Component so that react router doesn't recreate them
const Memoized = new Map();
function NamespaceFromURL(Component) {
  let C = Memoized.get(Component);
  if (!C) {
    C = function NamespaceInjector(props) {
      return <Component namespace={props.match.params.ns} {...props} />;
    };
    Memoized.set(Component, C);
  }
  return C;
}

const namespacedRoutes = namespacedPrefixes.reduce<string[]>(
  (acc, p) => [
    ...acc,
    `${p}/ns/:ns`,
    `${p}/all-namespaces`,
    `${CLUSTER_ROUTE_PREFIX}${p}/ns/:ns`,
    `${CLUSTER_ROUTE_PREFIX}${p}/all-namespaces`,
  ],
  [],
);

const DefaultPageRedirect: React.FC<{
  url: Perspective['properties']['landingPageURL'];
  flags: { [key: string]: boolean };
  firstVisit: boolean;
}> = ({ url, flags, firstVisit }) => {
  const [resolvedUrl, setResolvedUrl] = React.useState<string>();
  React.useEffect(() => {
    (async () => {
      setResolvedUrl((await url())(flags, firstVisit));
    })();
  }, [url, flags, firstVisit]);

  return resolvedUrl ? <Redirect to={resolvedUrl} /> : null;
};

type DefaultPageProps = {
  flags: FlagsObject;
};

// The default page component lets us connect to flags without connecting the entire App.
const DefaultPage_: React.FC<DefaultPageProps> = ({ flags }) => {
  const [activePerspective] = useActivePerspective();
  const perspectiveExtensions = usePerspectives();
  const [visited, setVisited, visitedLoaded] = useUserSettings<boolean>(
    getPerspectiveVisitedKey(activePerspective),
    false,
  );
  const firstVisit = React.useRef<boolean>();

  // First time thru, capture first visit status
  if (firstVisit.current == null && visitedLoaded) {
    firstVisit.current = !visited;
  }

  React.useEffect(() => {
    if (visitedLoaded && !visited) {
      // Mark perspective as visited
      setVisited(true);
    }
  }, [visitedLoaded, visited, setVisited]);

  if (Object.keys(flags).some((key) => flagPending(flags[key])) || !visitedLoaded) {
    return <LoadingBox />;
  }

  const perspective = perspectiveExtensions.find((p) => p?.properties?.id === activePerspective);

  // support redirecting to perspective landing page
  return (
    <DefaultPageRedirect
      flags={flags}
      firstVisit={firstVisit.current}
      url={perspective?.properties?.landingPageURL}
    />
  );
};

const DefaultPage = connectToFlags(FLAGS.OPENSHIFT, FLAGS.CAN_LIST_NS)(DefaultPage_);

const LazyRoute = (props) => (
  <Route
    {...props}
    component={undefined}
    render={(componentProps) => (
      <AsyncComponent loader={props.loader} kind={props.kind} {...componentProps} />
    )}
  />
);

const LazyDynamicRoute: React.FC<Omit<React.ComponentProps<typeof Route>, 'component'> & {
  component: LoadedExtension<DynamicRoutePage>['properties']['component'];
}> = ({ component, ...props }) => {
  const LazyComponent = React.useMemo(
    () =>
      React.lazy(async () => {
        const Component = await component();
        // TODO do not wrap as `default` when we support module code refs
        return { default: Component };
      }),
    [component],
  );
  return <Route {...props} component={LazyComponent} />;
};

const usePluginRoutePages = (): [
  LoadedExtension<RoutePage | DynamicRoutePage>[],
  LoadedExtension<RoutePage | DynamicRoutePage>[],
] => {
  const [activePerspective] = useActivePerspective();
  const routePageExtensions = useExtensions<RoutePage>(isRoutePage);
  const dynamicRoutePageExtensions = useExtensions<DynamicRoutePage>(isDynamicRoutePage);
  return React.useMemo(
    () =>
      [...routePageExtensions, ...dynamicRoutePageExtensions].reduce(
        ([activeBucket, inactiveBucket], extension) => {
          if (
            extension.properties.perspective &&
            extension.properties.perspective !== activePerspective
          ) {
            return [activeBucket, [...inactiveBucket, extension]];
          }
          return [[...activeBucket, extension], inactiveBucket];
        },
        [[], []],
      ),
    [activePerspective, dynamicRoutePageExtensions, routePageExtensions],
  );
};

const AppContents: React.FC<{}> = () => {
  const [activePluginRoutePages, inactivePluginRoutePages] = usePluginRoutePages();
  const [, allPluginsProcessed] = useDynamicPluginInfo();
  return (
    <div id="content">
      <PageSection
        variant={PageSectionVariants.light}
        sticky="top"
        padding={{ default: 'noPadding' }}
      >
        <GlobalNotifications />
        <Route path={namespacedRoutes} component={NamespaceBar} />
      </PageSection>
      <div id="content-scrollable">
        <PageSection
          variant={PageSectionVariants.light}
          className="pf-page__main-section--flex"
          padding={{ default: 'noPadding' }}
        >
          <ErrorBoundaryPage>
            <React.Suspense fallback={<LoadingBox />}>
              <Switch>
                {activePluginRoutePages.map((extension) => {
                  const paths = [
                    ...addPrefixToPaths(extension.properties.path, ''),
                    ...addPrefixToPaths(extension.properties.path, CLUSTER_ROUTE_PREFIX),
                  ];
                  if (isDynamicRoutePage(extension)) {
                    return (
                      <LazyDynamicRoute
                        key={extension.uid}
                        exact={extension.properties.exact}
                        path={paths}
                        component={extension.properties.component}
                      />
                    );
                  }
                  if (isRoutePage(extension)) {
                    return extension.properties.loader ? (
                      <LazyRoute key={extension.uid} {...extension.properties} path={paths} />
                    ) : (
                      <Route key={extension.uid} {...extension.properties} path={paths} />
                    );
                  }
                  return null;
                })}
                <Redirect from="/all-namespaces" to="/k8s/all-namespaces" />
                <Redirect from="/ns/:ns" to="/k8s/ns/:ns" />
                <Redirect from="/cluster-status" to="/dashboards" />
                <Redirect from="/status/all-namespaces" to="/dashboards" />
                <Redirect from="/status/ns/:ns" to="/k8s/cluster/projects/:ns" />
                <Redirect from="/overview/all-namespaces" to="/dashboards" />
                <Redirect from="/overview/ns/:ns" to="/k8s/cluster/projects/:ns/workloads" />
                <Redirect
                  exact
                  from="/k8s/ns/:ns/batch~v1beta1~CronJob/:name"
                  to={`/k8s/ns/:ns/${CronJobModel.plural}/:name`}
                />

                <Redirect from="/c/:cluster/all-namespaces" to="/c/:cluster/k8s/all-namespaces" />
                <Redirect from="/c/:cluster/ns/:ns" to="/c/:cluster/k8s/ns/:ns" />
                <Redirect from="/c/:cluster/cluster-status" to="/c/:cluster/dashboards" />
                <Redirect from="/c/:cluster/status/all-namespaces" to="/c/:cluster/dashboards" />
                <Redirect
                  from="/c/:cluster/status/ns/:ns"
                  to="/c/:cluster/k8s/cluster/projects/:ns"
                />
                <Redirect from="/c/:cluster/overview/all-namespaces" to="/c/:cluster/dashboards" />
                <Redirect
                  from="/c/:cluster/overview/ns/:ns"
                  to="/c/:cluster/k8s/cluster/projects/:ns/workloads"
                />
                <Redirect
                  exact
                  from="/c/:cluster/k8s/ns/:ns/batch~v1beta1~CronJob/:name"
                  to={`/c/:cluster/k8s/ns/:ns/${CronJobModel.plural}/:name`}
                />

                <LazyRoute
                  path={['/c/:cluster/dashboards', '/dashboards']}
                  loader={() =>
                    import(
                      './dashboard/dashboards-page/dashboards' /* webpackChunkName: "dashboards" */
                    ).then((m) => m.DashboardsPage)
                  }
                />

                {/* Redirect legacy routes to avoid breaking links */}
                <Route
                  path={['/c/:cluster/status', '/status']}
                  exact
                  component={NamespaceRedirect}
                />
                <Route
                  path={['/c/:cluster/overview', '/overview']}
                  exact
                  component={NamespaceRedirect}
                />

                <LazyRoute
                  path={['/c/:cluster/api-explorer', '/api-explorer']}
                  exact
                  loader={() =>
                    import('./api-explorer' /* webpackChunkName: "api-explorer" */).then(
                      (m) => m.APIExplorerPage,
                    )
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/api-resource/cluster/:plural',
                    '/api-resource/cluster/:plural',
                  ]}
                  loader={() =>
                    import('./api-explorer' /* webpackChunkName: "api-explorer" */).then(
                      (m) => m.APIResourcePage,
                    )
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/api-resource/all-namespaces/:plural',
                    '/api-resource/all-namespaces/:plural',
                  ]}
                  loader={() =>
                    import('./api-explorer' /* webpackChunkName: "api-explorer" */).then((m) =>
                      NamespaceFromURL(m.APIResourcePage),
                    )
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/api-resource/ns/:ns/:plural', '/api-resource/ns/:ns/:plural']}
                  loader={() =>
                    import('./api-explorer' /* webpackChunkName: "api-explorer" */).then((m) =>
                      NamespaceFromURL(m.APIResourcePage),
                    )
                  }
                />

                <LazyRoute
                  path={['/c/:cluster/command-line-tools', '/command-line-tools']}
                  exact
                  loader={() =>
                    import(
                      './command-line-tools' /* webpackChunkName: "command-line-tools" */
                    ).then((m) => m.CommandLineToolsPage)
                  }
                />

                <Route
                  path={['/c/:cluster/operatorhub', '/operatorhub']}
                  exact
                  component={NamespaceRedirect}
                />

                <LazyRoute
                  path={[
                    '/c/:cluster/catalog/instantiate-template',
                    '/catalog/instantiate-template',
                  ]}
                  exact
                  loader={() =>
                    import(
                      './instantiate-template' /* webpackChunkName: "instantiate-template" */
                    ).then((m) => m.InstantiateTemplatePage)
                  }
                />

                <Route
                  path={[
                    '/c/:cluster/k8s/ns/:ns/alertmanagers/:name',
                    '/k8s/ns/:ns/alertmanagers/:name',
                  ]}
                  exact
                  render={({ match }) => (
                    <Redirect
                      to={`/k8s/ns/${match.params.ns}/${referenceForModel(AlertmanagerModel)}/${
                        match.params.name
                      }`}
                    />
                  )}
                />

                <LazyRoute
                  path={['/c/:cluster/k8s/all-namespaces/events', '/k8s/all-namespaces/events']}
                  exact
                  loader={() =>
                    import('./events' /* webpackChunkName: "events" */).then((m) =>
                      NamespaceFromURL(m.EventStreamPage),
                    )
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/k8s/ns/:ns/events', '/k8s/ns/:ns/events']}
                  exact
                  loader={() =>
                    import('./events' /* webpackChunkName: "events" */).then((m) =>
                      NamespaceFromURL(m.EventStreamPage),
                    )
                  }
                />
                <Route
                  path={['/c/:cluster/search/all-namespaces', '/search/all-namespaces']}
                  exact
                  component={NamespaceFromURL(SearchPage)}
                />
                <Route
                  path={['/c/:cluster/search/ns/:ns', '/search/ns/:ns']}
                  exact
                  component={NamespaceFromURL(SearchPage)}
                />
                <Route
                  path={['/c/:cluster/search', '/search']}
                  exact
                  component={NamespaceRedirect}
                />

                <LazyRoute
                  path={['/c/:cluster/k8s/all-namespaces/import', '/k8s/all-namespaces/import']}
                  exact
                  loader={() =>
                    import('./import-yaml' /* webpackChunkName: "import-yaml" */).then((m) =>
                      NamespaceFromURL(m.ImportYamlPage),
                    )
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/k8s/ns/:ns/import/', '/k8s/ns/:ns/import/']}
                  exact
                  loader={() =>
                    import('./import-yaml' /* webpackChunkName: "import-yaml" */).then((m) =>
                      NamespaceFromURL(m.ImportYamlPage),
                    )
                  }
                />

                {
                  // These pages are temporarily disabled. We need to update the safe resources list.
                  // <LazyRoute path="k8s/cluster/clusterroles/:name/add-rule" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
                  // <LazyRoute path="k8s/cluster/clusterroles/:name/:rule/edit" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
                }

                {
                  // <LazyRoute path="k8s/ns/:ns/roles/:name/add-rule" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
                  // <LazyRoute path="k8s/ns/:ns/roles/:name/:rule/edit" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
                }

                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/secrets/~new/:type',
                    '/k8s/ns/:ns/secrets/~new/:type',
                  ]}
                  exact
                  kind="Secret"
                  loader={() =>
                    import('./secrets/create-secret' /* webpackChunkName: "create-secret" */).then(
                      (m) => m.CreateSecret,
                    )
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/k8s/ns/:ns/configmaps/~new', '/k8s/ns/:ns/configmaps/~new']}
                  exact
                  kind="ConfigMap"
                  loader={() =>
                    import(
                      './configmaps/ConfigMapPage' /* webpackChunkName: "create-configmap-page" */
                    ).then((m) => m.default)
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/configmaps/:name/edit',
                    '/k8s/ns/:ns/configmaps/:name/edit',
                  ]}
                  exact
                  kind="ConfigMap"
                  loader={() =>
                    import(
                      './configmaps/ConfigMapPage' /* webpackChunkName: "edit-configmap-page" */
                    ).then((m) => m.default)
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/secrets/:name/edit',
                    '/k8s/ns/:ns/secrets/:name/edit',
                  ]}
                  exact
                  kind="Secret"
                  loader={() =>
                    import('./secrets/create-secret' /* webpackChunkName: "create-secret" */).then(
                      (m) => m.EditSecret,
                    )
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/secrets/:name/edit-yaml',
                    '/k8s/ns/:ns/secrets/:name/edit-yaml',
                  ]}
                  exact
                  kind="Secret"
                  loader={() => import('./create-yaml').then((m) => m.EditYAMLPage)}
                />

                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/networkpolicies/~new/form',
                    '/k8s/ns/:ns/networkpolicies/~new/form',
                  ]}
                  exact
                  kind="NetworkPolicy"
                  loader={() =>
                    import(
                      '@console/app/src/components/network-policies/create-network-policy' /* webpackChunkName: "create-network-policy" */
                    ).then((m) => m.CreateNetworkPolicy)
                  }
                />

                <LazyRoute
                  path={['/c/:cluster/k8s/ns/:ns/routes/~new', '/k8s/ns/:ns/routes/~new']}
                  exact
                  kind="Route"
                  loader={() =>
                    import('./routes/RoutePage' /* webpackChunkName: "create-route" */).then(
                      (m) => m.RoutePage,
                    )
                  }
                />

                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/routes/:name/edit',
                    '/k8s/ns/:ns/routes/:name/edit',
                  ]}
                  exact
                  kind="Route"
                  loader={() =>
                    import('./routes/RoutePage' /* webpackChunkName: "edit-route" */).then(
                      (m) => m.RoutePage,
                    )
                  }
                />

                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/cluster/rolebindings/~new',
                    '/k8s/cluster/rolebindings/~new',
                  ]}
                  exact
                  loader={() =>
                    import('./RBAC' /* webpackChunkName: "rbac" */).then((m) => m.CreateRoleBinding)
                  }
                  kind="RoleBinding"
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/rolebindings/~new',
                    '/k8s/ns/:ns/rolebindings/~new',
                  ]}
                  exact
                  loader={() =>
                    import('./RBAC' /* webpackChunkName: "rbac" */).then((m) => m.CreateRoleBinding)
                  }
                  kind="RoleBinding"
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/rolebindings/:name/copy',
                    '/k8s/ns/:ns/rolebindings/:name/copy',
                  ]}
                  exact
                  kind="RoleBinding"
                  loader={() =>
                    import('./RBAC' /* webpackChunkName: "rbac" */).then((m) => m.CopyRoleBinding)
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/rolebindings/:name/edit',
                    '/k8s/ns/:ns/rolebindings/:name/edit',
                  ]}
                  exact
                  kind="RoleBinding"
                  loader={() =>
                    import('./RBAC' /* webpackChunkName: "rbac" */).then((m) => m.EditRoleBinding)
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/cluster/clusterrolebindings/:name/copy',
                    '/k8s/cluster/clusterrolebindings/:name/copy',
                  ]}
                  exact
                  kind="ClusterRoleBinding"
                  loader={() =>
                    import('./RBAC' /* webpackChunkName: "rbac" */).then((m) => m.CopyRoleBinding)
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/cluster/clusterrolebindings/:name/edit',
                    '/k8s/cluster/clusterrolebindings/:name/edit',
                  ]}
                  exact
                  kind="ClusterRoleBinding"
                  loader={() =>
                    import('./RBAC' /* webpackChunkName: "rbac" */).then((m) => m.EditRoleBinding)
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/:plural/:name/attach-storage',
                    '/k8s/ns/:ns/:plural/:name/attach-storage',
                  ]}
                  exact
                  loader={() =>
                    import(
                      './storage/attach-storage' /* webpackChunkName: "attach-storage" */
                    ).then((m) => m.default)
                  }
                />

                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/persistentvolumeclaims/~new/form',
                    '/k8s/ns/:ns/persistentvolumeclaims/~new/form',
                  ]}
                  exact
                  kind="PersistentVolumeClaim"
                  loader={() =>
                    import('./storage/create-pvc' /* webpackChunkName: "create-pvc" */).then(
                      (m) => m.CreatePVC,
                    )
                  }
                />

                <LazyRoute
                  path={[
                    `/c/:cluster/k8s/ns/:ns/${VolumeSnapshotModel.plural}/~new/form`,
                    `/k8s/ns/:ns/${VolumeSnapshotModel.plural}/~new/form`,
                  ]}
                  exact
                  loader={() =>
                    import(
                      '@console/app/src/components/volume-snapshot/create-volume-snapshot/create-volume-snapshot' /* webpackChunkName: "create-volume-snapshot" */
                    ).then((m) => m.VolumeSnapshot)
                  }
                />

                <LazyRoute
                  path={[
                    `/c/:cluster/k8s/all-namespaces/${VolumeSnapshotModel.plural}/~new/form`,
                    `/k8s/all-namespaces/${VolumeSnapshotModel.plural}/~new/form`,
                  ]}
                  exact
                  loader={() =>
                    import(
                      '@console/app/src/components/volume-snapshot/create-volume-snapshot/create-volume-snapshot' /* webpackChunkName: "create-volume-snapshot" */
                    ).then((m) => m.VolumeSnapshot)
                  }
                />

                <LazyRoute
                  path={['/c/:cluster/monitoring/alerts', '/monitoring/alerts']}
                  exact
                  loader={() =>
                    import('./monitoring/alerting' /* webpackChunkName: "alerting" */).then(
                      (m) => m.MonitoringUI,
                    )
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/monitoring/alertrules', '/monitoring/alertrules']}
                  exact
                  loader={() =>
                    import('./monitoring/alerting' /* webpackChunkName: "alerting" */).then(
                      (m) => m.MonitoringUI,
                    )
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/monitoring/silences', '/monitoring/silences']}
                  exact
                  loader={() =>
                    import('./monitoring/alerting' /* webpackChunkName: "alerting" */).then(
                      (m) => m.MonitoringUI,
                    )
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/monitoring/alertmanageryaml', '/monitoring/alertmanageryaml']}
                  exact
                  loader={() =>
                    import('./monitoring/alerting' /* webpackChunkName: "alerting" */).then(
                      (m) => m.MonitoringUI,
                    )
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/monitoring/alertmanagerconfig',
                    '/monitoring/alertmanagerconfig',
                  ]}
                  exact
                  loader={() =>
                    import('./monitoring/alerting' /* webpackChunkName: "alerting" */).then(
                      (m) => m.MonitoringUI,
                    )
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/monitoring/alertmanagerconfig/receivers/~new',
                    '/monitoring/alertmanagerconfig/receivers/~new',
                  ]}
                  exact
                  loader={() =>
                    import(
                      './monitoring/receiver-forms/alert-manager-receiver-forms' /* webpackChunkName: "receiver-forms" */
                    ).then((m) => m.CreateReceiver)
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/monitoring/alertmanagerconfig/receivers/:name/edit',
                    '/monitoring/alertmanagerconfig/receivers/:name/edit',
                  ]}
                  exact
                  loader={() =>
                    import(
                      './monitoring/receiver-forms/alert-manager-receiver-forms' /* webpackChunkName: "receiver-forms" */
                    ).then((m) => m.EditReceiver)
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/monitoring', '/monitoring']}
                  loader={() =>
                    import('./monitoring/alerting' /* webpackChunkName: "alerting" */).then(
                      (m) => m.MonitoringUI,
                    )
                  }
                />

                <LazyRoute
                  path={['/c/:cluster/settings/idp/github', '/settings/idp/github']}
                  exact
                  loader={() =>
                    import(
                      './cluster-settings/github-idp-form' /* webpackChunkName: "github-idp-form" */
                    ).then((m) => m.AddGitHubPage)
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/settings/idp/gitlab', '/settings/idp/gitlab']}
                  exact
                  loader={() =>
                    import(
                      './cluster-settings/gitlab-idp-form' /* webpackChunkName: "gitlab-idp-form" */
                    ).then((m) => m.AddGitLabPage)
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/settings/idp/google', '/settings/idp/google']}
                  exact
                  loader={() =>
                    import(
                      './cluster-settings/google-idp-form' /* webpackChunkName: "google-idp-form" */
                    ).then((m) => m.AddGooglePage)
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/settings/idp/htpasswd', '/settings/idp/htpasswd']}
                  exact
                  loader={() =>
                    import(
                      './cluster-settings/htpasswd-idp-form' /* webpackChunkName: "htpasswd-idp-form" */
                    ).then((m) => m.AddHTPasswdPage)
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/settings/idp/keystone', '/settings/idp/keystone']}
                  exact
                  loader={() =>
                    import(
                      './cluster-settings/keystone-idp-form' /* webpackChunkName: "keystone-idp-form" */
                    ).then((m) => m.AddKeystonePage)
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/settings/idp/ldap', '/settings/idp/ldap']}
                  exact
                  loader={() =>
                    import(
                      './cluster-settings/ldap-idp-form' /* webpackChunkName: "ldap-idp-form" */
                    ).then((m) => m.AddLDAPPage)
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/settings/idp/oidconnect', '/settings/idp/oidconnect']}
                  exact
                  loader={() =>
                    import(
                      './cluster-settings/openid-idp-form' /* webpackChunkName: "openid-idp-form" */
                    ).then((m) => m.AddOpenIDIDPPage)
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/settings/idp/basicauth', '/settings/idp/basicauth']}
                  exact
                  loader={() =>
                    import(
                      './cluster-settings/basicauth-idp-form' /* webpackChunkName: "basicauth-idp-form" */
                    ).then((m) => m.AddBasicAuthPage)
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/settings/idp/requestheader', '/settings/idp/requestheader']}
                  exact
                  loader={() =>
                    import(
                      './cluster-settings/request-header-idp-form' /* webpackChunkName: "request-header-idp-form" */
                    ).then((m) => m.AddRequestHeaderPage)
                  }
                />
                <LazyRoute
                  path={['/c/:cluster/settings/cluster', '/settings/cluster']}
                  loader={() =>
                    import(
                      './cluster-settings/cluster-settings' /* webpackChunkName: "cluster-settings" */
                    ).then((m) => m.ClusterSettingsPage)
                  }
                />

                <LazyRoute
                  path={'/c/:cluster/k8s/cluster/storageclasses/~new/form'}
                  exact
                  loader={() =>
                    import(
                      './storage-class-form' /* webpackChunkName: "storage-class-form" */
                    ).then((m) => m.StorageClassForm)
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/:resourceRef/form',
                    '/k8s/ns/:ns/:resourceRef/form',
                  ]}
                  exact
                  kind="PodDisruptionBudgets"
                  loader={() =>
                    import(
                      '@console/app/src/components/pdb/PDBFormPage' /* webpackChunkName: "PDBFormPage" */
                    ).then((m) => m.PDBFormPage)
                  }
                />
                <Route
                  path={['/c/:cluster/k8s/cluster/:plural', '/k8s/cluster/:plural']}
                  exact
                  component={ResourceListPage}
                />
                <Route
                  path={['/c/:cluster/k8s/cluster/:plural/~new', '/k8s/cluster/:plural/~new']}
                  exact
                  component={CreateResource}
                />
                <Route
                  path={['/c/:cluster/k8s/cluster/:plural/:name', '/k8s/cluster/:plural/:name']}
                  component={ResourceDetailsPage}
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/pods/:podName/containers/:name/debug',
                    '/k8s/ns/:ns/pods/:podName/containers/:name/debug',
                  ]}
                  loader={() =>
                    import('./debug-terminal' /* webpackChunkName: "debug-terminal" */).then(
                      (m) => m.DebugTerminalPage,
                    )
                  }
                />
                <LazyRoute
                  path={[
                    '/c/:cluster/k8s/ns/:ns/pods/:podName/containers/:name',
                    '/k8s/ns/:ns/pods/:podName/containers/:name',
                  ]}
                  loader={() => import('./container').then((m) => m.ContainersDetailsPage)}
                />
                <Route
                  path={['/c/:cluster/k8s/ns/:ns/:plural/~new', '/k8s/ns/:ns/:plural/~new']}
                  component={CreateResource}
                />
                <Route
                  path={['/c/:cluster/k8s/ns/:ns/:plural/:name', '/k8s/ns/:ns/:plural/:name']}
                  component={ResourceDetailsPage}
                />
                <Route
                  path={['/c/:cluster/k8s/ns/:ns/:plural', '/k8s/ns/:ns/:plural']}
                  exact
                  component={ResourceListPage}
                />

                <Route
                  path={['/c/:cluster/k8s/all-namespaces/:plural', '/k8s/all-namespaces/:plural']}
                  exact
                  component={ResourceListPage}
                />
                <Route
                  path={[
                    '/c/:cluster/k8s/all-namespaces/:plural/:name',
                    '/k8s/all-namespaces/:plural/:name',
                  ]}
                  component={ResourceDetailsPage}
                />

                {inactivePluginRoutePages.map((extension) => (
                  <Route
                    key={extension.uid}
                    {...extension.properties}
                    path={[
                      ...addPrefixToPaths(extension.properties.path, ''),
                      ...addPrefixToPaths(extension.properties.path, CLUSTER_ROUTE_PREFIX),
                    ]}
                    component={() => (
                      <PerspectiveRedirect perspective={extension.properties.perspective} />
                    )}
                  />
                ))}

                <LazyRoute
                  path={['/c/:cluster/error', '/error']}
                  exact
                  loader={() =>
                    import('./error' /* webpackChunkName: "error" */).then((m) => m.ErrorPage)
                  }
                />
                <Route path={['/c/:cluster', '/']} exact component={DefaultPage} />

                {allPluginsProcessed ? (
                  <LazyRoute
                    loader={() =>
                      import('./error' /* webpackChunkName: "error" */).then((m) => m.ErrorPage404)
                    }
                  />
                ) : (
                  <Route component={LoadingBox} />
                )}
              </Switch>
            </React.Suspense>
          </ErrorBoundaryPage>
        </PageSection>
      </div>
    </div>
  );
};

export default AppContents;
