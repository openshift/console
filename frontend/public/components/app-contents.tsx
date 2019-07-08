import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';

import { FLAGS } from '../const';
import { connectToFlags, flagPending } from '../reducers/features';
import { GlobalNotifications } from './global-notifications';
import { NamespaceBar } from './namespace';
import { SearchPage } from './search';
import { ResourceDetailsPage, ResourceListPage } from './resource-list';
import { AsyncComponent, Loading } from './utils';
import { namespacedPrefixes } from './utils/link';
import { ClusterServiceVersionModel, SubscriptionModel, AlertmanagerModel } from '../models';
import { referenceForModel } from '../module/k8s';
import * as plugins from '../plugins';
import { NamespaceRedirect } from './utils/namespace-redirect';
import { getActivePerspective } from '../reducers/ui';
import { RootState } from '../redux';

//PF4 Imports
import {
  PageSection,
  PageSectionVariants,
} from '@patternfly/react-core';

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
  flags: {[key: string]: boolean};
};

// The default page component lets us connect to flags without connecting the entire App.
const DefaultPage_: React.FC<DefaultPageProps> = ({ flags, activePerspective }) => {
  const openshiftFlag = flags[FLAGS.OPENSHIFT];

  if (flagPending(openshiftFlag)) {
    return <Loading />;
  }
  // support redirecting to perspective landing page
  return openshiftFlag ? (
    <Redirect
      to={
        plugins.registry.getPerspectives().find((p) => p.properties.id === activePerspective)
          .properties.landingPageURL
      }
    />
  ) : (
    <Redirect
      to={
        plugins.registry.getPerspectives().find((p) => p.properties.id === activePerspective)
          .properties.k8sLandingPageURL
      }
    />
  );
};

const DefaultPage = connect((state: RootState) => ({
  activePerspective: getActivePerspective(state),
}))(
  connectToFlags(FLAGS.OPENSHIFT)(DefaultPage_),
);

const LazyRoute = (props) => (
  <Route
    {...props}
    component={undefined}
    render={(componentProps) => (
      <AsyncComponent loader={props.loader} kind={props.kind} {...componentProps} />
    )}
  />
);

const pageRouteExtensions = plugins.registry.getRoutePages().map((r) => {
  const Component = r.properties.loader ? LazyRoute : Route;
  return <Component {...r.properties} key={Array.from(r.properties.path).join(',')} />;
});

// use `withRouter` to force a re-render when routes change since we are using React.memo
const AppContents = withRouter(React.memo(() => (
  <PageSection variant={PageSectionVariants.light}>
    <div id="content">
      <GlobalNotifications />
      <Route path={namespacedRoutes} component={NamespaceBar} />
      <div id="content-scrollable">
        <Switch>
          {pageRouteExtensions}

          <Route path={['/all-namespaces', '/ns/:ns']} component={RedirectComponent} />

          <LazyRoute path="/dashboards" loader={() => import('./dashboards-page/dashboards' /* webpackChunkName: "dashboards" */).then(m => m.DashboardsPage)} />
          <LazyRoute path="/cluster-status" exact loader={() => import('./cluster-overview' /* webpackChunkName: "cluster-overview" */).then(m => m.ClusterOverviewPage)} />
          <Redirect from="/overview/all-namespaces" to="/cluster-status" />
          <Redirect from="/overview/ns/:ns" to="/k8s/cluster/projects/:ns/workloads" />
          <Route path="/overview" exact component={NamespaceRedirect} />
          <LazyRoute path="/api-explorer" exact loader={() => import('./api-explorer' /* webpackChunkName: "api-explorer" */).then(m => m.APIExplorerPage)} />
          <LazyRoute path="/api-explorer/:plural" loader={() => import('./api-explorer' /* webpackChunkName: "api-explorer" */).then(m => m.APIResourcePage)} />

          <LazyRoute path="/start-guide" exact loader={() => import('./start-guide' /* webpackChunkName: "start-guide" */).then(m => m.StartGuidePage)} />
          <LazyRoute path="/command-line-tools" exact loader={() => import('./command-line-tools' /* webpackChunkName: "command-line-tools" */).then(m => m.CommandLineToolsPage)} />

          <LazyRoute path="/operatorhub/all-namespaces" exact loader={() => import('./operator-hub/operator-hub-page' /* webpackChunkName: "operator-hub" */).then(m => m.OperatorHubPage)} />
          <LazyRoute path="/operatorhub/ns/:ns" exact loader={() => import('./operator-hub/operator-hub-page' /* webpackChunkName: "operator-hub" */).then(m => m.OperatorHubPage)} />
          <Route path="/operatorhub" exact component={NamespaceRedirect} />
          <LazyRoute path="/operatorhub/subscribe" exact loader={() => import('./operator-hub/operator-hub-subscribe' /* webpackChunkName: "operator-hub-subscribe" */).then(m => m.OperatorHubSubscribePage)} />

          <LazyRoute path="/catalog/all-namespaces" exact loader={() => import('./catalog/catalog-page' /* webpackChunkName: "catalog" */).then(m => m.CatalogPage)} />
          <LazyRoute path="/catalog/ns/:ns" exact loader={() => import('./catalog/catalog-page' /* webpackChunkName: "catalog" */).then(m => m.CatalogPage)} />
          <Route path="/catalog" exact component={NamespaceRedirect} />

          <LazyRoute path="/provisionedservices/all-namespaces" loader={() => import('./provisioned-services' /* webpackChunkName: "provisionedservices" */).then(m => m.ProvisionedServicesPage)} />
          <LazyRoute path="/provisionedservices/ns/:ns" loader={() => import('./provisioned-services' /* webpackChunkName: "provisionedservices" */).then(m => m.ProvisionedServicesPage)} />
          <Route path="/provisionedservices" component={NamespaceRedirect} />

          <LazyRoute path="/operatormanagement/all-namespaces" loader={() => import('./operator-management' /* webpackChunkName: "operator-management" */).then(m => m.OperatorManagementPage)} />
          <LazyRoute path="/operatormanagement/ns/:ns" loader={() => import('./operator-management' /* webpackChunkName: "operator-management" */).then(m => m.OperatorManagementPage)} />
          <Route path="/operatormanagement" component={NamespaceRedirect} />

          <LazyRoute path="/brokermanagement" loader={() => import('./broker-management' /* webpackChunkName: "brokermanagment" */).then(m => m.BrokerManagementPage)} />

          <LazyRoute path={`/k8s/ns/:ns/${SubscriptionModel.plural}/~new`} exact loader={() => import('./operator-lifecycle-manager' /* webpackChunkName: "create-subscription-yaml" */).then(m => NamespaceFromURL(m.CreateSubscriptionYAML))} />

          <LazyRoute path="/catalog/create-service-instance" exact loader={() => import('./service-catalog/create-instance' /* webpackChunkName: "create-service-instance" */).then(m => m.CreateInstancePage)} />
          <LazyRoute path="/k8s/ns/:ns/serviceinstances/:name/create-binding" exact loader={() => import('./service-catalog/create-binding' /* webpackChunkName: "create-binding" */).then(m => m.CreateBindingPage)} />
          <LazyRoute path="/catalog/instantiate-template" exact loader={() => import('./instantiate-template' /* webpackChunkName: "instantiate-template" */).then(m => m.InstantiateTemplatePage)} />

          <Route path="/k8s/ns/:ns/alertmanagers/:name" exact render={({match}) => <Redirect to={`/k8s/ns/${match.params.ns}/${referenceForModel(AlertmanagerModel)}/${match.params.name}`} />} />

          <LazyRoute path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:name/edit`} exact loader={() => import('./create-yaml' /* webpackChunkName: "create-yaml" */).then(m => m.EditYAMLPage)} kind={referenceForModel(ClusterServiceVersionModel)} />
          <LazyRoute path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/~new`} exact loader={() => import('./operator-lifecycle-manager/create-operand' /* webpackChunkName: "create-operand" */).then(m => m.CreateOperandPage)} />
          <Route path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/:name`} component={ResourceDetailsPage} />

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

          <LazyRoute path="/deploy-image" exact loader={() => import('./deploy-image').then(m => m.DeployImage)} />

          <LazyRoute path="/k8s/ns/:ns/secrets/~new/:type" exact kind="Secret" loader={() => import('./secrets/create-secret' /* webpackChunkName: "create-secret" */).then(m => m.CreateSecret)} />
          <LazyRoute path="/k8s/ns/:ns/secrets/:name/edit" exact kind="Secret" loader={() => import('./secrets/create-secret' /* webpackChunkName: "create-secret" */).then(m => m.EditSecret)} />
          <LazyRoute path="/k8s/ns/:ns/secrets/:name/edit-yaml" exact kind="Secret" loader={() => import('./create-yaml').then(m => m.EditYAMLPage)} />

          <LazyRoute path="/k8s/ns/:ns/routes/~new/form" exact kind="Route" loader={() => import('./routes/create-route' /* webpackChunkName: "create-route" */).then(m => m.CreateRoute)} />

          <LazyRoute path="/k8s/cluster/rolebindings/~new" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CreateRoleBinding)} kind="RoleBinding" />
          <LazyRoute path="/k8s/ns/:ns/rolebindings/~new" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CreateRoleBinding)} kind="RoleBinding" />
          <LazyRoute path="/k8s/ns/:ns/rolebindings/:name/copy" exact kind="RoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CopyRoleBinding)} />
          <LazyRoute path="/k8s/ns/:ns/rolebindings/:name/edit" exact kind="RoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRoleBinding)} />
          <LazyRoute path="/k8s/cluster/clusterrolebindings/:name/copy" exact kind="ClusterRoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CopyRoleBinding)} />
          <LazyRoute path="/k8s/cluster/clusterrolebindings/:name/edit" exact kind="ClusterRoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRoleBinding)} />
          <LazyRoute path="/k8s/ns/:ns/:plural/:name/attach-storage" exact loader={() => import('./storage/attach-storage' /* webpackChunkName: "attach-storage" */).then(m => m.AttachStorage)} />

          <LazyRoute path="/k8s/ns/:ns/persistentvolumeclaims/~new/form" exact kind="PersistentVolumeClaim" loader={() => import('./storage/create-pvc' /* webpackChunkName: "create-pvc" */).then(m => m.CreatePVC)} />

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

          <LazyRoute path={'/k8s/cluster/storageclasses/~new/form'} exact loader={() => import('./storage-class-form' /* webpackChunkName: "storage-class-form" */).then(m => m.StorageClassForm)} />

          <Route path="/k8s/cluster/:plural" exact component={ResourceListPage} />
          <LazyRoute path="/k8s/cluster/:plural/~new" exact loader={() => import('./create-yaml' /* webpackChunkName: "create-yaml" */).then(m => m.CreateYAML)} />
          <Route path="/k8s/cluster/:plural/:name" component={ResourceDetailsPage} />
          <LazyRoute path="/k8s/ns/:ns/pods/:podName/containers/:name" loader={() => import('./container').then(m => m.ContainersDetailsPage)} />
          <LazyRoute path="/k8s/ns/:ns/:plural/~new" exact loader={() => import('./create-yaml' /* webpackChunkName: "create-yaml" */).then(m => NamespaceFromURL(m.CreateYAML))} />
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
)));

export default AppContents;
