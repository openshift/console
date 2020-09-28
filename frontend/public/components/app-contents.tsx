import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';

import { FLAGS } from '@console/shared';
import { connectToFlags, flagPending, FlagsObject } from '../reducers/features';
import { GlobalNotifications } from './global-notifications';
import { NamespaceBar } from './namespace';
import { SearchPage } from './search';
import { ResourceDetailsPage, ResourceListPage } from './resource-list';
import { AsyncComponent, LoadingBox } from './utils';
import { namespacedPrefixes } from './utils/link';
import { AlertmanagerModel } from '../models';
import { referenceForModel } from '../module/k8s';
import * as plugins from '../plugins';
import { NamespaceRedirect } from './utils/namespace-redirect';
import { getActivePerspective } from '../reducers/ui';
import { RootState } from '../redux';
import { pluralToKind } from './hypercloud/form';

//PF4 Imports
import { PageSection, PageSectionVariants } from '@patternfly/react-core';

const RedirectComponent = props => {
  const to = `/k8s${props.location.pathname}`;
  return <Redirect to={to} />;
};

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

const namespacedRoutes = [];
_.each(namespacedPrefixes, p => {
  namespacedRoutes.push(`${p}/ns/:ns`);
  namespacedRoutes.push(`${p}/all-namespaces`);
});

type DefaultPageProps = {
  activePerspective: string;
  flags: FlagsObject;
};

// The default page component lets us connect to flags without connecting the entire App.
const DefaultPage_: React.FC<DefaultPageProps> = ({ flags, activePerspective }) => {
  if (Object.keys(flags).some(key => flagPending(flags[key]))) {
    return <LoadingBox />;
  }
  // support redirecting to perspective landing page
  return flags[FLAGS.OPENSHIFT] ? (
    <Redirect
      to={plugins.registry
        .getPerspectives()
        .find(p => p.properties.id === activePerspective)
        .properties.getLandingPageURL(flags)}
    />
  ) : (
      <Redirect
        to={plugins.registry
          .getPerspectives()
          .find(p => p.properties.id === activePerspective)
          .properties.getK8sLandingPageURL(flags)}
      />
    );
};

const DefaultPage = connect((state: RootState) => ({
  activePerspective: getActivePerspective(state),
}))(connectToFlags(FLAGS.OPENSHIFT, FLAGS.CAN_LIST_NS)(DefaultPage_));

const LazyRoute = props => {
  let kind = props.kind;
  let plural;
  if (kind === 'form') {
    plural = kind === 'form' && props.computedMatch.params.plural;
    // type = kind === 'form' && props.computedMatch.params.type;
    kind = pluralToKind(plural);
    let loader = () =>
      import(`./${plural}/create-${kind.toLowerCase()}` /* webpackChunkName: "create-secret" */).then(
        (m) => m[`Create${kind}`],
      )

    return <Route {...props} component={undefined} render={componentProps => <AsyncComponent loader={loader} kind={kind} {...componentProps} />} />;
  }
  return <Route {...props} component={undefined} render={componentProps => <AsyncComponent loader={props.loader} kind={kind} {...componentProps} />} />;
};

const getPluginPageRoutes = (activePerspective: string, flags: FlagsObject) =>
  plugins.registry
    .getRoutePages()
    .filter(e => plugins.registry.isExtensionInUse(e, flags))
    .map(r => {
      if (r.properties.perspective && r.properties.perspective !== activePerspective) {
        return null;
      }
      const Component = r.properties.loader ? LazyRoute : Route;
      return <Component {...r.properties} key={Array.from(r.properties.path).join(',')} />;
    });

type AppContentsProps = {
  activePerspective: string;
  flags: FlagsObject;
};

const AppContents_: React.FC<AppContentsProps> = ({ activePerspective, flags }) => (
  <PageSection variant={PageSectionVariants.light}>
    <div id="content">
      <GlobalNotifications />
      <Route path={namespacedRoutes} component={NamespaceBar} />
      {/* tabIndex is necessary to restore keyboard scrolling as a result of PatternFly's <Page> having a hard-coded tabIndex.  See https://github.com/patternfly/patternfly-react/issues/4180 */}
      <div id="content-scrollable" tabIndex={-1}>
        <Switch>
          {getPluginPageRoutes(activePerspective, flags)}

          <Route path={['/all-namespaces', '/ns/:ns']} component={RedirectComponent} />
          <LazyRoute path="/dashboards" loader={() => import('./dashboard/dashboards-page/dashboards' /* webpackChunkName: "dashboards" */).then(m => m.DashboardsPage)} />

          {/* Redirect legacy routes to avoid breaking links */}
          <Redirect from="/cluster-status" to="/dashboards" />
          <Redirect from="/status/all-namespaces" to="/dashboards" />
          <Redirect from="/status/ns/:ns" to="/k8s/cluster/projects/:ns" />
          <Route path="/status" exact component={NamespaceRedirect} />
          <Redirect from="/overview/all-namespaces" to="/dashboards" />
          <Redirect from="/overview/ns/:ns" to="/k8s/cluster/projects/:ns/workloads" />
          <Route path="/overview" exact component={NamespaceRedirect} />

          <LazyRoute path="/api-explorer" exact loader={() => import('./api-explorer' /* webpackChunkName: "api-explorer" */).then(m => m.APIExplorerPage)} />
          <LazyRoute path="/api-resource/cluster/:plural" loader={() => import('./api-explorer' /* webpackChunkName: "api-explorer" */).then(m => m.APIResourcePage)} />
          <LazyRoute path="/api-resource/all-namespaces/:plural" loader={() => import('./api-explorer' /* webpackChunkName: "api-explorer" */).then(m => NamespaceFromURL(m.APIResourcePage))} />
          <LazyRoute path="/api-resource/ns/:ns/:plural" loader={() => import('./api-explorer' /* webpackChunkName: "api-explorer" */).then(m => NamespaceFromURL(m.APIResourcePage))} />

          <LazyRoute path="/command-line-tools" exact loader={() => import('./command-line-tools' /* webpackChunkName: "command-line-tools" */).then(m => m.CommandLineToolsPage)} />

          <Route path="/operatorhub" exact component={NamespaceRedirect} />

          <LazyRoute path="/catalog/all-namespaces" exact loader={() => import('./catalog/catalog-page' /* webpackChunkName: "catalog" */).then(m => m.CatalogPage)} />
          <LazyRoute path="/catalog/ns/:ns" exact loader={() => import('./catalog/catalog-page' /* webpackChunkName: "catalog" */).then(m => m.CatalogPage)} />
          <Route path="/catalog" exact component={NamespaceRedirect} />

          <LazyRoute path="/provisionedservices/all-namespaces" loader={() => import('./provisioned-services' /* webpackChunkName: "provisionedservices" */).then(m => m.ProvisionedServicesPage)} />
          <LazyRoute path="/provisionedservices/ns/:ns" loader={() => import('./provisioned-services' /* webpackChunkName: "provisionedservices" */).then(m => m.ProvisionedServicesPage)} />
          <Route path="/provisionedservices" component={NamespaceRedirect} />

          <LazyRoute path="/brokermanagement" loader={() => import('./broker-management' /* webpackChunkName: "brokermanagment" */).then(m => m.BrokerManagementPage)} />

          <LazyRoute path="/catalog/create-service-instance" exact loader={() => import('./service-catalog/create-instance' /* webpackChunkName: "create-service-instance" */).then(m => m.CreateInstancePage)} />
          <LazyRoute path="/k8s/ns/:ns/serviceinstances/:name/create-binding" exact loader={() => import('./service-catalog/create-binding' /* webpackChunkName: "create-binding" */).then(m => m.CreateBindingPage)} />
          <LazyRoute path="/catalog/instantiate-template" exact loader={() => import('./instantiate-template' /* webpackChunkName: "instantiate-template" */).then(m => m.InstantiateTemplatePage)} />

          <Route path="/k8s/ns/:ns/alertmanagers/:name" exact render={({ match }) => <Redirect to={`/k8s/ns/${match.params.ns}/${referenceForModel(AlertmanagerModel)}/${match.params.name}`} />} />

          <LazyRoute path="/k8s/all-namespaces/events" exact loader={() => import('./events' /* webpackChunkName: "events" */).then(m => NamespaceFromURL(m.EventStreamPage))} />
          <LazyRoute path="/k8s/ns/:ns/events" exact loader={() => import('./events' /* webpackChunkName: "events" */).then(m => NamespaceFromURL(m.EventStreamPage))} />
          <Route path="/search/all-namespaces" exact component={NamespaceFromURL(SearchPage)} />
          <Route path="/search/ns/:ns" exact component={NamespaceFromURL(SearchPage)} />
          <Route path="/search" exact component={NamespaceRedirect} />

          <LazyRoute path="/k8s/all-namespaces/import" exact loader={() => import('./import-yaml' /* webpackChunkName: "import-yaml" */).then(m => NamespaceFromURL(m.ImportYamlPage))} />
          <LazyRoute path="/k8s/ns/:ns/import/" exact loader={() => import('./import-yaml' /* webpackChunkName: "import-yaml" */).then(m => NamespaceFromURL(m.ImportYamlPage))} />

          {
            // These pages are temporarily disabled. We need to update the safe resources list.
            // <LazyRoute path="/k8s/cluster/clusterroles/:name/add-rule" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
            // <LazyRoute path="/k8s/cluster/clusterroles/:name/:rule/edit" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
          }

          {
            // <LazyRoute path="/k8s/ns/:ns/roles/:name/add-rule" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
            // <LazyRoute path="/k8s/ns/:ns/roles/:name/:rule/edit" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
          }

          {/* <LazyRoute
            path="/k8s/ns/:ns/secrets/~new/:type"
            exact
            kind="Secret"
            loader={() =>
              import('./secrets/create-secret' ).then(
                (m) => m.CreateSecret,
              )
            }
          /> */} // 기존에 있는 Secret 생성페이지 라우트 (공통 폼에디터 라우트 임의로 secrete파일로 해놨는데 다른 샘플 생기면 수정 필요)
          <LazyRoute path="/k8s/ns/:ns/routes/~new/form" exact kind="Route" loader={() => import('./routes/create-route' /* webpackChunkName: "create-route" */).then(m => m.CreateRoute)} />
          <LazyRoute path="/k8s/cluster/rolebindings/~new" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CreateRoleBinding)} kind="RoleBinding" />
          <LazyRoute path="/k8s/ns/:ns/rolebindings/~new" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CreateRoleBinding)} kind="RoleBinding" />
          <LazyRoute path="/k8s/ns/:ns/persistentvolumeclaims/~new/form" exact kind="PersistentVolumeClaim" loader={() => import('./storage/create-pvc' /* webpackChunkName: "create-pvc" */).then(m => m.CreatePVC)} />
          <LazyRoute path="/monitoring/alertmanagerconfig/receivers/~new" exact loader={() => import('./monitoring/receiver-forms/alert-manager-receiver-forms' /* webpackChunkName: "receiver-forms" */).then(m => m.CreateReceiver)} />
          <LazyRoute path={'/k8s/cluster/storageclasses/~new/form'} exact loader={() => import('./storage-class-form' /* webpackChunkName: "storage-class-form" */).then(m => m.StorageClassForm)} />
          <LazyRoute path="/k8s/cluster/:plural/~new" exact loader={() => import('./create-yaml' /* webpackChunkName: "create-yaml" */).then(m => m.CreateYAML)} />
          <LazyRoute path="/k8s/ns/:ns/:plural/~new" exact loader={() => import('./create-yaml' /* webpackChunkName: "create-yaml" */).then(m => NamespaceFromURL(m.CreateYAML))} />
          <LazyRoute
            path="/k8s/ns/:ns/:plural/~new/:type"
            exact
            kind="form"
          />

          <LazyRoute path="/k8s/ns/:ns/secrets/:name/edit" exact kind="Secret" loader={() => import('./secrets/create-secret' /* webpackChunkName: "create-secret" */).then(m => m.EditSecret)} />
          <LazyRoute path="/k8s/ns/:ns/secrets/:name/edit-yaml" exact kind="Secret" loader={() => import('./create-yaml').then(m => m.EditYAMLPage)} />
          <LazyRoute path="/k8s/ns/:ns/rolebindings/:name/copy" exact kind="RoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CopyRoleBinding)} />
          <LazyRoute path="/k8s/ns/:ns/rolebindings/:name/edit" exact kind="RoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRoleBinding)} />
          <LazyRoute path="/k8s/cluster/clusterrolebindings/:name/copy" exact kind="ClusterRoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CopyRoleBinding)} />
          <LazyRoute path="/k8s/cluster/clusterrolebindings/:name/edit" exact kind="ClusterRoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRoleBinding)} />
          <LazyRoute path="/k8s/ns/:ns/:plural/:name/attach-storage" exact loader={() => import('./storage/attach-storage' /* webpackChunkName: "attach-storage" */).then(m => m.AttachStorage)} />


          <LazyRoute path="/monitoring/alerts" exact loader={() => import('./monitoring' /* webpackChunkName: "monitoring" */).then(m => m.MonitoringUI)} />
          <LazyRoute path="/monitoring/alertrules" exact loader={() => import('./monitoring' /* webpackChunkName: "monitoring" */).then(m => m.MonitoringUI)} />
          <LazyRoute path="/monitoring/silences" exact loader={() => import('./monitoring' /* webpackChunkName: "monitoring" */).then(m => m.MonitoringUI)} />
          <LazyRoute path="/monitoring/alertmanageryaml" exact loader={() => import('./monitoring' /* webpackChunkName: "monitoring" */).then(m => m.MonitoringUI)} />
          <LazyRoute path="/monitoring/alertmanagerconfig" exact loader={() => import('./monitoring' /* webpackChunkName: "monitoring" */).then(m => m.MonitoringUI)} />
          <LazyRoute path="/monitoring/alertmanagerconfig/receivers/:name/edit" exact loader={() => import('./monitoring/receiver-forms/alert-manager-receiver-forms' /* webpackChunkName: "receiver-forms" */).then(m => m.EditReceiver)} />
          <LazyRoute path="/monitoring" loader={() => import('./monitoring' /* webpackChunkName: "monitoring" */).then(m => m.MonitoringUI)} />

          <LazyRoute path="/settings/idp/github" exact loader={() => import('./cluster-settings/github-idp-form' /* webpackChunkName: "github-idp-form" */).then(m => m.AddGitHubPage)} />
          <LazyRoute path="/settings/idp/gitlab" exact loader={() => import('./cluster-settings/gitlab-idp-form' /* webpackChunkName: "gitlab-idp-form" */).then(m => m.AddGitLabPage)} />
          <LazyRoute path="/settings/idp/google" exact loader={() => import('./cluster-settings/google-idp-form' /* webpackChunkName: "google-idp-form" */).then(m => m.AddGooglePage)} />
          <LazyRoute path="/settings/idp/htpasswd" exact loader={() => import('./cluster-settings/htpasswd-idp-form' /* webpackChunkName: "htpasswd-idp-form" */).then(m => m.AddHTPasswdPage)} />
          <LazyRoute path="/settings/idp/keystone" exact loader={() => import('./cluster-settings/keystone-idp-form' /* webpackChunkName: "keystone-idp-form" */).then(m => m.AddKeystonePage)} />
          <LazyRoute path="/settings/idp/ldap" exact loader={() => import('./cluster-settings/ldap-idp-form' /* webpackChunkName: "ldap-idp-form" */).then(m => m.AddLDAPPage)} />
          <LazyRoute path="/settings/idp/oidconnect" exact loader={() => import('./cluster-settings/openid-idp-form' /* webpackChunkName: "openid-idp-form" */).then(m => m.AddOpenIDPage)} />
          <LazyRoute path="/settings/idp/basicauth" exact loader={() => import('./cluster-settings/basicauth-idp-form' /* webpackChunkName: "basicauth-idp-form" */).then(m => m.AddBasicAuthPage)} />
          <LazyRoute path="/settings/idp/requestheader" exact loader={() => import('./cluster-settings/request-header-idp-form' /* webpackChunkName: "request-header-idp-form" */).then(m => m.AddRequestHeaderPage)} />
          <LazyRoute path="/settings/cluster" loader={() => import('./cluster-settings/cluster-settings' /* webpackChunkName: "cluster-settings" */).then(m => m.ClusterSettingsPage)} />


          <Route path="/k8s/cluster/:plural" exact component={ResourceListPage} />
          <Route path="/k8s/cluster/:plural/:name" component={ResourceDetailsPage} />
          <LazyRoute path="/k8s/ns/:ns/pods/:podName/containers/:name" loader={() => import('./container').then(m => m.ContainersDetailsPage)} />
          <Route path="/k8s/ns/:ns/:plural/:name" component={ResourceDetailsPage} />
          <Route path="/k8s/ns/:ns/:plural" exact component={ResourceListPage} />

          <Route path="/k8s/all-namespaces/:plural" exact component={ResourceListPage} />
          <Route path="/k8s/all-namespaces/:plural/:name" component={ResourceDetailsPage} />

          <LazyRoute path="/error" exact loader={() => import('./error' /* webpackChunkName: "error" */).then(m => m.ErrorPage)} />
          <Route path="/" exact component={DefaultPage} />

          <LazyRoute loader={() => import('./error' /* webpackChunkName: "error" */).then(m => m.ErrorPage404)} />
        </Switch>
      </div>
    </div>
  </PageSection>
);

const AppContents = connect((state: RootState) => ({
  activePerspective: getActivePerspective(state),
}))(connectToFlags(...plugins.registry.getGatingFlagNames([plugins.isRoutePage]))(AppContents_));

export default AppContents;
