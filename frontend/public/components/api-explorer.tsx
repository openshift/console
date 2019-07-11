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
import { CheckBox, CheckBoxControls } from './row-filter';
import { DefaultPage } from './default-resource';
import { Table, TextFilter } from './factory';
import { resourceListPages } from './resource-pages';
import { ExploreType } from './sidebars/explore-type-sidebar';
import {
  AsyncComponent,
  BreadCrumbs,
  Dropdown,
  EmptyBox,
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

const EmptyAPIResourcesMsg: React.FC<{}> = () => <EmptyBox label="API Resources" />;

const Group: React.FC<{value: string}> = ({value}) => {
  if (!value) {
    return <>-</>;
  }

  const [first, ...rest] = value.split('.');
  return _.isEmpty(rest)
    ? <>{value}</>
    : <>{first}<span className="text-muted">.{rest.join('.')}</span></>;
};

const APIResourceHeader = () => [{
  title: 'Kind',
  sortField: 'kind',
  transforms: [sortable],
}, {
  title: 'Group',
  sortField: 'apiGroup',
  transforms: [sortable],
}, {
  title: 'Version',
  sortField: 'apiVersion',
  transforms: [sortable],
}];

const APIResourceRows = ({componentProps: {data}}) => _.map(data, (model: K8sKind) => [{
  title: <APIResourceLink model={model} />,
}, {
  title: <span className="co-select-to-copy"><Group value={model.apiGroup} /></span>,
}, {
  title: model.apiVersion,
}]);

const stateToProps = ({k8s}) => ({
  models: k8s.getIn(['RESOURCES', 'models']),
});

const APIResourcesList = connect<APIResourcesListPropsFromState>(stateToProps)(({models}) => {
  const ALL = '#all#';
  const [textFilter, setTextFilter] = React.useState('');
  const [groupFilter, setGroupFilter] = React.useState(ALL);
  const [versionFilter, setVersionFilter] = React.useState(ALL);

  // group options
  const groups: Set<string> = models.reduce((result: Set<string>, {apiGroup}) => {
    return apiGroup ? result.add(apiGroup) : result;
  }, new Set<string>());
  const sortedGroups: string[] = [...groups].sort();
  const groupOptions = sortedGroups.reduce((result, group: string) => {
    result[group] = <Group value={group} />;
    return result;
  }, {[ALL]: 'All Groups', '': 'No Group'});

  const groupSpacer = new Set<string>();
  if (sortedGroups.length) {
    groupSpacer.add(sortedGroups[0]);
  }

  const autocompleteGroups = (text: string, item: string, key: string): boolean => {
    return key !== ALL && fuzzy(text, key);
  };

  // version options
  const versions: Set<string> = models.reduce((result: Set<string>, {apiVersion}) => {
    return result.add(apiVersion);
  }, new Set<string>());
  const sortedVersions: string[] = [...versions].sort();
  const versionOptions = sortedVersions.reduce((result, version: string) => {
    result[version] = version;
    return result;
  }, {[ALL]: 'All Versions'});

  const versionSpacer = new Set<string>();
  if (sortedVersions.length) {
    versionSpacer.add(sortedVersions[0]);
  }

  // filter by group, version, or text
  const filteredResources = models.filter(({kind, apiGroup, apiVersion}) => {
    if (groupFilter !== ALL && (apiGroup || '') !== groupFilter) {
      return false;
    }

    if (versionFilter !== ALL && apiVersion !== versionFilter) {
      return false;
    }

    if (textFilter) {
      const text = textFilter.toLowerCase();
      return fuzzy(text, kind.toLowerCase()) || (apiGroup && fuzzy(text, apiGroup));
    }

    return true;
  });

  // Put models with no API group (core k8s resources) at the top.
  const sortedResources = _.sortBy(filteredResources.toArray(), [({apiGroup}) => apiGroup || '1', 'apiVersion', 'kind']);

  return <>
    <div className="co-m-pane__filter-bar">
      <div className="co-m-pane__filter-bar-group">
        <Dropdown
          autocompleteFilter={autocompleteGroups}
          items={groupOptions}
          onChange={(group: string) => setGroupFilter(group)}
          selectedKey={groupFilter}
          spacerBefore={groupSpacer}
          title={groupOptions[groupFilter]}
        />
        <Dropdown
          items={versionOptions}
          onChange={(version: string) => setVersionFilter(version)}
          selectedKey={versionFilter}
          spacerBefore={versionSpacer}
          title={versionOptions[versionFilter]}
        />
      </div>
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
        EmptyMsg={EmptyAPIResourcesMsg}
        Header={APIResourceHeader}
        Rows={APIResourceRows}
        aria-label="API Resources"
        data={sortedResources}
        loaded={!!models.size}
      />
    </div>
  </>;
});
APIResourcesList.displayName = 'APIResourcesList';

export const APIExplorerPage: React.FC<{}> = () => <>
  <Helmet>
    <title>API Explorer</title>
  </Helmet>
  <div className="co-m-nav-title">
    <h1 className="co-m-pane__heading">API Explorer</h1>
  </div>
  <APIResourcesList />
</>;
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
          <>
            <dt>Description</dt>
            <dd className="co-break-word co-pre-line"><LinkifyExternal>{description}</LinkifyExternal></dd>
          </>
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

const Subject: React.FC<{value: string}> = ({value}) => {
  const [first, ...rest] = value.split(':');
  return first === 'system' && !_.isEmpty(rest)
    ? (
      <>
        <span className="text-muted">{first}:</span>
        {rest.join(':')}
      </>
    )
    : <>{value}</>;
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
  title: <span className="co-break-word co-select-to-copy"><Subject value={subject.name} /></span>,
}, {
  title: subject.type,
}]);

const EmptyAccessReviewMsg: React.FC<{}> = () => <EmptyBox label="Subjects" />;

const APIResourceAccessReview: React.FC<APIResourceTabProps> = ({kindObj, namespace}) => {
  // TODO: Make sure verbs are filled in for all models. Currently static models don't use verbs from API discovery.
  const verbs: K8sVerb[] = (kindObj.verbs || ['create', 'delete', 'deletecollection', 'get', 'list', 'patch', 'update', 'watch']).sort();

  // state
  const [verb, setVerb] = React.useState(_.first(verbs));
  const [filter, setFilter] = React.useState('');
  const [showUsers, setShowUsers] = React.useState(true);
  const [showGroups, setShowGroups] = React.useState(true);
  const [showServiceAccounts, setShowServiceAccounts] = React.useState(false);
  const [accessResponse, setAccessResponse] = React.useState();
  const [error, setError] = React.useState(null);

  // perform the access review
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

  // break into users, groups, and service accounts
  const users = [];
  const serviceAccounts = [];
  _.each(accessResponse.users, (name: string) => {
    if (name.startsWith('system:serviceaccount:')) {
      serviceAccounts.push({name, type: 'ServiceAccount'});
    } else {
      users.push({name, type: 'User'});
    }
  });
  const groups = _.map(accessResponse.groups, (name: string) => ({ name, type: 'Group' }));

  // filter and sort
  const verbOptions = _.zipObject(verbs, verbs);
  const data = [
    ...(showUsers ? users : []),
    ...(showGroups ? groups : []),
    ...(showServiceAccounts ? serviceAccounts : []),
  ];
  const allSelected = showUsers && showGroups && showServiceAccounts;
  const itemCount = accessResponse.users.length + accessResponse.groups.length;
  const selectedCount = data.length;
  const filteredData = data.filter(({name}: {name: string}) => fuzzy(filter, name));
  const sortedData = _.orderBy(filteredData, ['type', 'name'], ['asc', 'asc']);

  // event handlers
  const onFilterChange: React.ReactEventHandler<HTMLInputElement> = (e) => setFilter(e.currentTarget.value);
  const toggleShowUsers = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowUsers(!showUsers);
  };
  const toggleShowGroups = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowGroups(!showGroups);
  };
  const toggleShowServiceAccounts = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowServiceAccounts(!showServiceAccounts);
  };
  const onSelectAll = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowUsers(true);
    setShowGroups(true);
    setShowServiceAccounts(true);
  };

  return (
    <>
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
      </div>
      <div className="co-m-pane__body">
        <CheckBoxControls
          allSelected={allSelected}
          itemCount={itemCount}
          selectedCount={selectedCount}
          onSelectAll={onSelectAll}
        >
          <CheckBox title="User" active={showUsers} number={users.length} toggle={toggleShowUsers} />
          <CheckBox title="Group" active={showGroups} number={groups.length} toggle={toggleShowGroups} />
          <CheckBox title="ServiceAccount" active={showServiceAccounts} number={serviceAccounts.length} toggle={toggleShowServiceAccounts} />
        </CheckBoxControls>
        <p className="co-m-pane__explanation">
          The following subjects can {verb} {kindObj.plural}
          {kindObj.namespaced && namespace && <> in namespace {namespace}</>}
          {kindObj.namespaced && !namespace && <> in all namespaces</>}
          {!kindObj.namespaced && <> at the cluster scope</>}
          .
        </p>
        <Table
          EmptyMsg={EmptyAccessReviewMsg}
          Header={AccessTableHeader}
          Rows={AccessTableRows}
          aria-label="API Resources"
          data={sortedData}
          loaded
        />
      </div>
    </>
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

  return <>
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
  </>;
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
