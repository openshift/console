import * as React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { compose } from 'redux';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Map as ImmutableMap } from 'immutable';
import * as fuzzy from 'fuzzysearch';
import { Tooltip } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';

import { ALL_NAMESPACES_KEY, FLAGS, APIError } from '@console/shared';
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
  ResourceAccessReviewResponse,
} from '../module/k8s';
import { connectToFlags, FlagsObject } from '../reducers/features';
import { RootState } from '../redux';
import { CheckBox, CheckBoxControls } from './row-filter';
import { DefaultPage } from './default-resource';
import { Table, TextFilter } from './factory';
import { fuzzyCaseInsensitive } from './factory/table-filters';
import { resourceListPages } from './resource-pages';
import { ExploreType } from './sidebars/explore-type-sidebar';
import {
  AsyncComponent,
  BreadCrumbs,
  Dropdown,
  EmptyBox,
  HorizontalNav,
  LinkifyExternal,
  LoadError,
  LoadingBox,
  removeQueryArgument,
  ResourceIcon,
  ScrollToTopOnMount,
  setQueryArgument,
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

const APIResourceLink_: React.FC<APIResourceLinkStateProps & APIResourceLinkOwnProps> = ({
  activeNamespace,
  model,
}) => {
  const to = getAPIResourceLink(activeNamespace, model);
  return (
    <span className="co-resource-item">
      <span className="co-resource-icon--fixed-width hidden-xs">
        <ResourceIcon kind={referenceForModel(model)} />
      </span>
      <Link to={to} className="co-resource-item__resource-name">
        {model.kind}
      </Link>
    </span>
  );
};
const APIResourceLink = connect<APIResourceLinkStateProps, {}, APIResourceLinkOwnProps>(
  mapStateToProps,
)(APIResourceLink_);

const EmptyAPIResourcesMsg: React.FC<{}> = () => <EmptyBox label="API Resources" />;

const Group: React.FC<{ value: string }> = ({ value }) => {
  if (!value) {
    return <>-</>;
  }

  const [first, ...rest] = value.split('.');
  return _.isEmpty(rest) ? (
    <>{value}</>
  ) : (
    <>
      {first}
      <span className="text-muted">.{rest.join('.')}</span>
    </>
  );
};

const tableClasses = [
  'col-lg-3 col-md-3 col-sm-5 col-xs-4',
  'col-lg-2 col-md-2 col-sm-4 col-xs-4',
  'col-lg-2 col-md-2 col-sm-3 col-xs-4',
  'col-lg-2 hidden-md hidden-sm hidden-xs',
  'col-lg-3 col-md-5 hidden-sm hidden-xs',
];

const APIResourceHeader = () => [
  {
    title: 'Kind',
    sortField: 'kind',
    transforms: [sortable],
    props: { className: tableClasses[0] },
  },
  {
    title: 'Group',
    sortField: 'apiGroup',
    transforms: [sortable],
    props: { className: tableClasses[1] },
  },
  {
    title: 'Version',
    sortField: 'apiVersion',
    transforms: [sortable],
    props: { className: tableClasses[2] },
  },
  {
    title: 'Namespaced',
    sortField: 'namespaced',
    transforms: [sortable],
    props: { className: tableClasses[3] },
  },
  {
    title: 'Description',
    props: { className: tableClasses[4] },
  },
];

const APIResourceRows = ({ componentProps: { data } }) =>
  _.map(data, (model: K8sKind) => [
    {
      title: <APIResourceLink model={model} />,
      props: { className: tableClasses[0] },
    },
    {
      title: (
        <span className="co-select-to-copy">
          <Group value={model.apiGroup} />
        </span>
      ),
      props: { className: tableClasses[1] },
    },
    {
      title: model.apiVersion,
      props: { className: tableClasses[2] },
    },
    {
      title: model.namespaced ? 'true' : 'false',
      props: { className: tableClasses[3] },
    },
    {
      title: <div className="co-line-clamp">{getResourceDescription(model)}</div>,
      props: { className: tableClasses[4] },
    },
  ]);

const stateToProps = ({ k8s }) => ({
  models: k8s.getIn(['RESOURCES', 'models']),
});

const APIResourcesList = compose(
  withRouter,
  connect<APIResourcesListPropsFromState>(stateToProps),
)(({ models, location }) => {
  const ALL = '#all#';
  const GROUP_PARAM = 'g';
  const VERSION_PARAM = 'v';
  const TEXT_FILTER_PARAM = 'q';
  const SCOPE_PARAM = 's';
  const search = new URLSearchParams(location.search);
  // Differentiate between an empty group and an unspecified param.
  const groupFilter = search.has(GROUP_PARAM) ? search.get(GROUP_PARAM) : ALL;
  const versionFilter = search.get(VERSION_PARAM) || ALL;
  const textFilter = search.get(TEXT_FILTER_PARAM) || '';
  const scopeFilter = search.get(SCOPE_PARAM) || ALL;

  // group options
  const groups: Set<string> = models.reduce((result: Set<string>, { apiGroup }) => {
    return apiGroup ? result.add(apiGroup) : result;
  }, new Set<string>());
  const sortedGroups: string[] = [...groups].sort();
  const groupOptions = sortedGroups.reduce(
    (result, group: string) => {
      result[group] = <Group value={group} />;
      return result;
    },
    { [ALL]: 'All Groups', '': 'No Group' },
  );

  const groupSpacer = new Set<string>();
  if (sortedGroups.length) {
    groupSpacer.add(sortedGroups[0]);
  }

  const autocompleteGroups = (text: string, item: string, key: string): boolean => {
    return key !== ALL && fuzzy(text, key);
  };

  // version options
  const versions: Set<string> = models.reduce((result: Set<string>, { apiVersion }) => {
    return result.add(apiVersion);
  }, new Set<string>());
  const sortedVersions: string[] = [...versions].sort();
  const versionOptions = sortedVersions.reduce(
    (result, version: string) => {
      result[version] = version;
      return result;
    },
    { [ALL]: 'All Versions' },
  );

  const versionSpacer = new Set<string>();
  if (sortedVersions.length) {
    versionSpacer.add(sortedVersions[0]);
  }

  const scopeOptions = {
    [ALL]: 'All Scopes',
    cluster: 'Cluster',
    namespace: 'Namespace',
  };
  const scopeSpacer = new Set<string>(['cluster']);

  // filter by group, version, or text
  const filteredResources = models.filter(({ kind, apiGroup, apiVersion, namespaced }) => {
    if (groupFilter !== ALL && (apiGroup || '') !== groupFilter) {
      return false;
    }

    if (versionFilter !== ALL && apiVersion !== versionFilter) {
      return false;
    }

    if (scopeFilter === 'cluster' && namespaced) {
      return false;
    }

    if (scopeFilter === 'namespace' && !namespaced) {
      return false;
    }

    if (textFilter) {
      return fuzzyCaseInsensitive(textFilter, kind);
    }

    return true;
  });

  // Put models with no API group (core k8s resources) at the top.
  const sortedResources = _.sortBy(filteredResources.toArray(), [
    ({ apiGroup }) => apiGroup || '1',
    'apiVersion',
    'kind',
  ]);

  const updateURL = (k: string, v: string) => {
    if (v === ALL) {
      removeQueryArgument(k);
    } else {
      setQueryArgument(k, v);
    }
  };
  const onGroupSelected = (group: string) => updateURL(GROUP_PARAM, group);
  const onVersionSelected = (version: string) => updateURL(VERSION_PARAM, version);
  const onScopeSelected = (scope: string) => updateURL(SCOPE_PARAM, scope);
  const setTextFilter = (text: string) => {
    if (!text) {
      removeQueryArgument(TEXT_FILTER_PARAM);
    } else {
      setQueryArgument(TEXT_FILTER_PARAM, text);
    }
  };

  return (
    <>
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <Dropdown
            autocompleteFilter={autocompleteGroups}
            items={groupOptions}
            onChange={onGroupSelected}
            selectedKey={groupFilter}
            spacerBefore={groupSpacer}
            title={groupOptions[groupFilter]}
            className="btn-group"
          />
          <Dropdown
            items={versionOptions}
            onChange={onVersionSelected}
            selectedKey={versionFilter}
            spacerBefore={versionSpacer}
            title={versionOptions[versionFilter]}
            className="btn-group"
          />
          <Dropdown
            items={scopeOptions}
            onChange={onScopeSelected}
            selectedKey={scopeFilter}
            spacerBefore={scopeSpacer}
            title={scopeOptions[scopeFilter]}
            className="btn-group"
          />
        </div>
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter value={textFilter} label="by kind" onChange={setTextFilter} />
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
          virtualize={false}
        />
      </div>
    </>
  );
});
APIResourcesList.displayName = 'APIResourcesList';

export const APIExplorerPage: React.FC<{}> = () => (
  <>
    <Helmet>
      <title>Explore API Resources</title>
    </Helmet>
    <div className="co-m-nav-title">
      <h1 className="co-m-pane__heading">Explore API Resources</h1>
    </div>
    <APIResourcesList />
  </>
);
APIExplorerPage.displayName = 'APIExplorerPage';

const APIResourceDetails: React.FC<APIResourceTabProps> = ({ customData: { kindObj } }) => {
  const { kind, apiGroup, apiVersion, namespaced, verbs, shortNames } = kindObj;
  const description = getResourceDescription(kindObj);
  return (
    <div className="co-m-pane__body">
      <dl className="co-m-pane__details">
        <dt>Kind</dt>
        <dd>{kind}</dd>
        <dt>API Group</dt>
        <dd className="co-select-to-copy">{apiGroup || '-'}</dd>
        <dt>API Version</dt>
        <dd>{apiVersion}</dd>
        <dt>Namespaced</dt>
        <dd>{namespaced ? 'true' : 'false'}</dd>
        <dt>Verbs</dt>
        <dd>{verbs.join(', ')}</dd>
        {shortNames && (
          <>
            <dt>
              <Tooltip content="Short names can be used to match this resource on the CLI.">
                <span>Short Names</span>
              </Tooltip>
            </dt>
            <dd>{shortNames.join(', ')}</dd>
          </>
        )}
        {description && (
          <>
            <dt>Description</dt>
            <dd className="co-break-word co-pre-wrap">
              <LinkifyExternal>{description}</LinkifyExternal>
            </dd>
          </>
        )}
      </dl>
    </div>
  );
};

const scrollTop = () => (document.getElementById('content-scrollable').scrollTop = 0);
const APIResourceSchema: React.FC<APIResourceTabProps> = ({ customData: { kindObj } }) => {
  return (
    <div className="co-m-pane__body">
      <ExploreType kindObj={kindObj} scrollTop={scrollTop} />
    </div>
  );
};

const APIResourceInstances: React.FC<APIResourceTabProps> = ({
  customData: { kindObj, namespace },
}) => {
  const componentLoader = resourceListPages.get(referenceForModel(kindObj), () =>
    Promise.resolve(DefaultPage),
  );
  const ns = kindObj.namespaced ? namespace : undefined;

  return (
    <AsyncComponent
      loader={componentLoader}
      namespace={ns}
      kind={kindObj.crd ? referenceForModel(kindObj) : kindObj.kind}
      showTitle={false}
      autoFocus={false}
    />
  );
};

const Subject: React.FC<{ value: string }> = ({ value }) => {
  const [first, ...rest] = value.split(':');
  return first === 'system' && !_.isEmpty(rest) ? (
    <>
      <span className="text-muted">{first}:</span>
      {rest.join(':')}
    </>
  ) : (
    <>{value}</>
  );
};

const AccessTableHeader = () => [
  {
    title: 'Subject',
    sortField: 'name',
    transforms: [sortable],
  },
  {
    title: 'Type',
    sortField: 'type',
    transforms: [sortable],
  },
];

const AccessTableRows = ({ componentProps: { data } }) =>
  _.map(data, (subject) => [
    {
      title: (
        <span className="co-break-word co-select-to-copy">
          <Subject value={subject.name} />
        </span>
      ),
    },
    {
      title: subject.type,
    },
  ]);

const EmptyAccessReviewMsg: React.FC<{}> = () => <EmptyBox label="Subjects" />;

const APIResourceAccessReview: React.FC<APIResourceTabProps> = ({
  customData: { kindObj, namespace },
}) => {
  const { apiGroup, apiVersion, namespaced, plural, verbs } = kindObj;

  // state
  const [verb, setVerb] = React.useState(_.first(verbs));
  const [filter, setFilter] = React.useState('');
  const [showUsers, setShowUsers] = React.useState(true);
  const [showGroups, setShowGroups] = React.useState(true);
  const [showServiceAccounts, setShowServiceAccounts] = React.useState(false);
  const [accessResponse, setAccessResponse] = React.useState<ResourceAccessReviewResponse>();
  const [error, setError] = React.useState<APIError>();

  // perform the access review
  React.useEffect(() => {
    setError(null);
    const accessReviewModel = namespace
      ? LocalResourceAccessReviewsModel
      : ResourceAccessReviewsModel;
    const req: ResourceAccessReviewRequest = {
      apiVersion: apiVersionForModel(accessReviewModel),
      kind: accessReviewModel.kind,
      namespace,
      resourceAPIVersion: apiVersion,
      resourceAPIGroup: apiGroup,
      resource: plural,
      verb,
    };
    k8sCreate(accessReviewModel, req, { ns: namespace })
      .then(setAccessResponse)
      .catch(setError);
  }, [apiGroup, apiVersion, plural, namespace, verb]);

  if (error) {
    return (
      <LoadError
        message={error.message}
        label="Access Review"
        className="loading-box loading-box__errored"
      />
    );
  }

  if (!accessResponse) {
    return <LoadingBox />;
  }

  // break into users, groups, and service accounts
  const users = [];
  const serviceAccounts = [];
  _.each(accessResponse.users, (name: string) => {
    if (name.startsWith('system:serviceaccount:')) {
      serviceAccounts.push({ name, type: 'ServiceAccount' });
    } else {
      users.push({ name, type: 'User' });
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
  const filteredData = data.filter(({ name }: { name: string }) => fuzzy(filter, name));
  const sortedData = _.orderBy(filteredData, ['type', 'name'], ['asc', 'asc']);

  // event handlers
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
          <TextFilter defaultValue={filter} label="by subject" onChange={(val) => setFilter(val)} />
        </div>
      </div>
      <div className="co-m-pane__body">
        <CheckBoxControls
          allSelected={allSelected}
          itemCount={itemCount}
          selectedCount={selectedCount}
          onSelectAll={onSelectAll}
        >
          <CheckBox
            title="User"
            active={showUsers}
            number={users.length}
            toggle={toggleShowUsers}
          />
          <CheckBox
            title="Group"
            active={showGroups}
            number={groups.length}
            toggle={toggleShowGroups}
          />
          <CheckBox
            title="ServiceAccount"
            active={showServiceAccounts}
            number={serviceAccounts.length}
            toggle={toggleShowServiceAccounts}
          />
        </CheckBoxControls>
        <p className="co-m-pane__explanation">
          The following subjects can {verb} {plural}
          {namespaced && namespace && <> in namespace {namespace}</>}
          {namespaced && !namespace && <> in all namespaces</>}
          {!namespaced && <> at the cluster scope</>}.
        </p>
        <Table
          EmptyMsg={EmptyAccessReviewMsg}
          Header={AccessTableHeader}
          Rows={AccessTableRows}
          aria-label="API Resources"
          data={sortedData}
          loaded
          virtualize={false}
        />
      </div>
    </>
  );
};

const APIResourcePage_ = ({
  match,
  kindObj,
  kindsInFlight,
  flags,
}: {
  match: any;
  kindObj: K8sKind;
  kindsInFlight: boolean;
  flags: FlagsObject;
}) => {
  if (!kindObj) {
    return kindsInFlight ? (
      <LoadingBox />
    ) : (
      <div className="co-m-pane__body">
        <h1 className="co-m-pane__heading co-m-pane__heading--center">404: Not Found</h1>
      </div>
    );
  }

  const breadcrumbs = [
    {
      name: 'Explore',
      path: '/api-explorer',
    },
    {
      name: 'Resource Details',
      path: match.url,
    },
  ];

  const pages = [
    {
      href: '',
      name: 'Details',
      component: APIResourceDetails,
    },
    {
      href: 'schema',
      name: 'Schema',
      component: APIResourceSchema,
    },
  ];

  if (_.isEmpty(kindObj.verbs) || kindObj.verbs.includes('list')) {
    pages.push({
      href: 'instances',
      name: 'Instances',
      component: APIResourceInstances,
    });
  }

  if (flags[FLAGS.OPENSHIFT]) {
    pages.push({
      href: 'access',
      name: 'Access Review',
      component: APIResourceAccessReview,
    });
  }

  const namespace = kindObj.namespaced ? match.params.ns : null;

  return (
    <>
      <ScrollToTopOnMount />
      <Helmet>
        <title>{kindObj.label}</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
        <BreadCrumbs breadcrumbs={breadcrumbs} />
        <h1 className="co-m-pane__heading" data-test-id="api-explorer-resource-title">
          {kindObj.label}
        </h1>
      </div>
      <HorizontalNav pages={pages} match={match} customData={{ kindObj, namespace }} noStatusBox />
    </>
  );
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
  customData: {
    kindObj: K8sKind;
    namespace?: string;
  };
};
