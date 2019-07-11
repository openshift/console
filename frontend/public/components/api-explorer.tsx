import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Map as ImmutableMap } from 'immutable';
import * as fuzzy from 'fuzzysearch';
import { sortable } from '@patternfly/react-table';

import { ALL_NAMESPACES_KEY, FLAGS } from '../const';
import { connectToModel } from '../kinds';
import { LocalResourceAccessReviewsModel, ResourceAccessReviewsModel } from '../models';
import {
  apiVersionForModel,
  k8sCreate,
  K8sKind,
  K8sResourceKindReference,
  K8sVerb,
  getResourceDescription,
  referenceForModel,
  ResourceAccessReviewRequest,
} from '../module/k8s';
import { connectToFlags } from '../reducers/features';
import { RootState } from '../redux';
import { DefaultPage } from './default-resource';
import { Table, TextFilter } from './factory';
import { resourceListPages } from './resource-pages';
import { ExploreType } from './sidebars/explore-type-sidebar';
import {
  AsyncComponent,
  BreadCrumbs,
  Dropdown,
  LinkifyExternal,
  LoadError,
  Loading,
  ResourceIcon,
  ScrollToTopOnMount,
  SimpleTabNav,
} from './utils';

const mapStateToProps = (state: RootState): APIResourceLinkStateProps => {
  return {
    activeNamespace: state.UI.get('activeNamespace'),
  };
};

const getAPIResourceLink = (activeNamespace: string, model: K8sKind) => {
  const ref = referenceForModel(model);
  if (!model.namespaced) {
    return `/api-resource/cluster/${ref}`;
  }

  if (activeNamespace === ALL_NAMESPACES_KEY) {
    return `/api-resource/all-namespaces/${ref}`;
  }

  return `/api-resource/ns/${activeNamespace}/${ref}`;
};

const APIResourceLink_: React.FC<APIResourceLinkStateProps & APIResourceLinkOwnProps> = ({activeNamespace, model}) => {
  const to = getAPIResourceLink(activeNamespace, model);
  return <span className="co-resource-item">
    <span className="co-resource-icon--fixed-width"><ResourceIcon kind={referenceForModel(model)} /></span>
    <Link to={to} className="co-resource-item__resource-name">{model.kind}</Link>
  </span>;
};
const APIResourceLink = connect<APIResourceLinkStateProps, {}, APIResourceLinkOwnProps>(mapStateToProps)(APIResourceLink_);

const APIResourceHeader = () => [{
  title: 'Kind',
}, {
  title: 'Group',
}, {
  title: 'Version',
}];

const APIResourceRows = ({componentProps: {data}}) => _.map(data, (model: K8sKind) => [{
  title: <APIResourceLink model={model} />,
}, {
  title: model.apiGroup || '-',
}, {
  title: model.apiVersion,
}]);

const stateToProps = ({k8s}) => ({
  models: k8s.getIn(['RESOURCES', 'models']),
});

const APIResourcesList = connect<APIResourcesListPropsFromState>(stateToProps)(({models}) => {
  const [textFilter, setTextFilter] = React.useState('');
  const filteredResources = textFilter
    ? models.filter(({kind, apiGroup}) => {
      const text = textFilter.toLowerCase();
      return fuzzy(text, kind.toLowerCase()) || (apiGroup && fuzzy(text, apiGroup));
    })
    : models;
  // Put models with no API group (core k8s resources) at the top.
  const sortedResources = _.sortBy(filteredResources.toArray(), [({apiGroup}) => apiGroup || '1', 'apiVersion', 'kind']);
  return <React.Fragment>
    <div className="co-m-pane__filter-bar">
      <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
        <TextFilter
          defaultValue={textFilter}
          label="by kind or group"
          onChange={(e) => setTextFilter(e.target.value)}
        />
      </div>
    </div>
    <div className="co-m-pane__body">
      <Table
        aria-label="API Resources"
        data={sortedResources}
        Header={APIResourceHeader}
        Rows={APIResourceRows}
        virtualize={false}
        loaded={!_.isEmpty(sortedResources)} />
    </div>
  </React.Fragment>;
});
APIResourcesList.displayName = 'APIResourcesList';

export const APIExplorerPage: React.FC<{}> = () => <React.Fragment>
  <Helmet>
    <title>API Explorer</title>
  </Helmet>
  <div className="co-m-nav-title">
    <h1 className="co-m-pane__heading">API Explorer</h1>
  </div>
  <APIResourcesList />
</React.Fragment>;
APIExplorerPage.displayName = 'APIExplorerPage';

const APIResourceOverview: React.FC<APIResourceTabProps> = ({kindObj}) => {
  const description = getResourceDescription(kindObj);
  return (
    <div className="co-m-pane__body">
      <dl className="co-m-pane__details">
        <dt>Kind</dt>
        <dd>{kindObj.kind}</dd>
        <dt>API Group</dt>
        <dd className="co-select-to-copy">{kindObj.apiGroup || '-'}</dd>
        <dt>API Version</dt>
        <dd>{kindObj.apiVersion}</dd>
        <dt>Namespaced</dt>
        <dd>{kindObj.namespaced ? 'true' : 'false'}</dd>
        {description && (
          <React.Fragment>
            <dt>Description</dt>
            <dd className="co-break-word co-pre-line"><LinkifyExternal>{description}</LinkifyExternal></dd>
          </React.Fragment>
        )}
      </dl>
    </div>
  );
};

const scrollTop = () => document.getElementById('content-scrollable').scrollTop = 0;
const APIResourceSchema: React.FC<APIResourceTabProps> = ({kindObj}) => {
  return (
    <div className="co-m-pane__body co-m-pane__body--no-top-margin">
      <ExploreType kindObj={kindObj} scrollTop={scrollTop} />
    </div>
  );
};

const APIResourceInstances: React.FC<APIResourceTabProps> = ({kindObj, namespace}) => {
  const componentLoader = resourceListPages.get(referenceForModel(kindObj), () => Promise.resolve(DefaultPage));
  const ns = kindObj.namespaced ? namespace : undefined;

  return <AsyncComponent loader={componentLoader} namespace={ns} kind={kindObj.crd ? referenceForModel(kindObj) : kindObj.kind} showTitle={false} autoFocus={false} />;
};

const AccessTableHeader = () => [{
  title: 'Subject',
  sortField: 'name',
  transforms: [sortable],
}, {
  title: 'Type',
  sortField: 'type',
  transforms: [sortable],
}];

const AccessTableRows = ({componentProps: {data}}) => _.map(data, (subject) => [{
  title: <span className="co-break-word co-select-to-copy">{subject.name}</span>,
}, {
  title: subject.type,
}]);

const APIResourceAccessReview: React.FC<APIResourceTabProps> = ({kindObj, namespace}) => {
  // TODO: Make sure verbs are filled in for all models. Currently static models don't use verbs from API discovery.
  const verbs: K8sVerb[] = (kindObj.verbs || ['create', 'delete', 'deletecollection', 'get', 'list', 'patch', 'update', 'watch']).sort();
  const [verb, setVerb] = React.useState(_.first(verbs));
  const [filter, setFilter] = React.useState('');
  const [showServiceAccounts, setShowServiceAccounts] = React.useState(false);
  const [accessResponse, setAccessResponse] = React.useState();
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    setError(null);
    const accessReviewModel = namespace ? LocalResourceAccessReviewsModel : ResourceAccessReviewsModel;
    const req: ResourceAccessReviewRequest = {
      apiVersion: apiVersionForModel(accessReviewModel),
      kind: accessReviewModel.kind,
      namespace,
      resourceAPIVersion: apiVersionForModel(kindObj),
      resourceAPIGroup: kindObj.apiGroup,
      resource: kindObj.plural,
      verb,
    };
    k8sCreate(accessReviewModel, req, { ns: namespace })
      .then(setAccessResponse)
      .catch(setError);
  }, [kindObj, namespace, verb]);

  if (error) {
    return <LoadError message={error.message} label="Access Review" className="loading-box loading-box__errored" />;
  }

  if (!accessResponse) {
    return <Loading />;
  }

  const verbOptions = _.zipObject(verbs, verbs);
  const users = _.reduce(accessResponse.users, (result, name: string) => {
    const isServiceAccount = name.startsWith('system:serviceaccount:');
    if (!showServiceAccounts && isServiceAccount) {
      return result;
    }
    const type = isServiceAccount ? 'ServiceAccount' : 'User';
    return [...result, { name, type }];
  }, []);
  const groups = _.map(accessResponse.groups, (name: string) => ({ name, type: 'Group' }));
  const filteredData = [...users, ...groups].filter(({name}: {name: string}) => fuzzy(filter, name));
  const sortedData = _.orderBy(filteredData, ['type', 'name'], ['asc', 'asc']);
  const onFilterChange: React.ReactEventHandler<HTMLInputElement> = (e) => setFilter(e.currentTarget.value);
  const onShowServiceAccountChange: React.ReactEventHandler<HTMLInputElement> = (e) => setShowServiceAccounts(e.currentTarget.checked);

  return (
    <React.Fragment>
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <Dropdown
            items={verbOptions}
            onChange={(v: K8sVerb) => setVerb(v)}
            selectedKey={verb}
            titlePrefix="Verb"
          />
        </div>
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter
            defaultValue={filter}
            label="by subject"
            onChange={onFilterChange}
          />
        </div>
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--full-width">
          <div className="checkbox">
            <label>
              <input type="checkbox"
                onChange={onShowServiceAccountChange}
                checked={showServiceAccounts}
              />
              Show service accounts
            </label>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <p className="co-m-pane__explanation">
          The following users and groups can {verb} {kindObj.plural}
          {kindObj.namespaced && namespace && <React.Fragment> in namespace {namespace}</React.Fragment>}
          {kindObj.namespaced && !namespace && <React.Fragment> in all namespaces</React.Fragment>}
          {!kindObj.namespaced && <React.Fragment> at the cluster scope</React.Fragment>}
          .
        </p>
        <Table
          aria-label="API Resources"
          data={sortedData}
          Header={AccessTableHeader}
          Rows={AccessTableRows}
          virtualize={false}
          loaded
        />
      </div>
    </React.Fragment>
  );
};

const APIResourcePage_ = ({match, kindObj, kindsInFlight, flags}: {match: any, kindObj: K8sKind, kindsInFlight: boolean, flags: {[key: string]: boolean}}) => {
  const [selectedTab, onClickTab] = React.useState('Overview');
  if (!kindObj) {
    return kindsInFlight
      ? <Loading />
      : <div className="co-m-pane__body">
        <h1 className="co-m-pane__heading co-m-pane__heading--center">404: Not Found</h1>
      </div>;
  }

  const breadcrumbs = [{
    name: 'API Explorer',
    path: '/api-explorer',
  }, {
    name: 'Resource Details',
    path: match.url,
  }];

  const tabs = [{
    name: 'Overview',
    component: APIResourceOverview,
  }, {
    name: 'Schema',
    component: APIResourceSchema,
  }];

  if (_.isEmpty(kindObj.verbs) || kindObj.verbs.includes('list')) {
    tabs.push({
      name: 'Instances',
      component: APIResourceInstances,
    });
  }

  if (flags[FLAGS.OPENSHIFT]) {
    tabs.push({
      name: 'Access Review',
      component: APIResourceAccessReview,
    });
  }

  const namespace = kindObj.namespaced ? match.params.ns : null;

  return <React.Fragment>
    <ScrollToTopOnMount />
    <Helmet>
      <title>{kindObj.label}</title>
    </Helmet>
    <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
      <BreadCrumbs breadcrumbs={breadcrumbs} />
      <h1 className="co-m-pane__heading">{kindObj.label}</h1>
    </div>
    <SimpleTabNav
      onClickTab={onClickTab}
      selectedTab={selectedTab}
      tabProps={{kindObj, namespace}}
      tabs={tabs}
    />
  </React.Fragment>;
};
export const APIResourcePage = connectToModel(connectToFlags(FLAGS.OPENSHIFT)(APIResourcePage_));

type APIResourceLinkStateProps = {
  activeNamespace: string;
};

type APIResourcesListPropsFromState = {
  models: ImmutableMap<K8sResourceKindReference, K8sKind>;
};

type APIResourceLinkOwnProps = {
  model: K8sKind;
};

type APIResourceTabProps = {
  kindObj: K8sKind;
  namespace?: string;
};
