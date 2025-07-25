import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { useLocation, useParams, Link, useSearchParams } from 'react-router-dom-v5-compat';
import { connect } from 'react-redux';
import { compose } from 'redux';
import * as _ from 'lodash-es';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { Map as ImmutableMap } from 'immutable';
import * as fuzzy from 'fuzzysearch';
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarToggleGroup,
  Switch,
  FlexItem,
  Flex,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

import { ALL_NAMESPACES_KEY, FLAGS, APIError, getTitleForNodeKind } from '@console/shared';
import { useExactSearch } from '@console/app/src/components/user-preferences/search/useExactSearch';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import { Page, useAccessReview } from '@console/internal/components/utils';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

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
import { connectToFlags } from '../reducers/connectToFlags';
import { RootState } from '../redux';
import { RowFilter } from './row-filter';
import { DefaultPage } from './default-resource';
import { Table, TextFilter } from './factory';
import { exactMatch, fuzzyCaseInsensitive } from './factory/table-filters';
import { getResourceListPages } from './resource-pages';
import { ExploreType } from './sidebars/explore-type-sidebar';
import {
  AsyncComponent,
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
import { isResourceListPage, useExtensions, ResourceListPage } from '@console/plugin-sdk';
import {
  ResourceListPage as DynamicResourceListPage,
  isResourceListPage as isDynamicResourceListPage,
} from '@console/dynamic-plugin-sdk';
import { getK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { ErrorPage404 } from './error';
import { DescriptionListTermHelp } from '@console/shared/src/components/description-list/DescriptionListTermHelp';

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
  const { t } = useTranslation();
  const to = getAPIResourceLink(activeNamespace, model);
  return (
    <span className="co-resource-item">
      <span className="co-resource-icon--fixed-width pf-v6-u-display-none pf-v6-u-display-flex-on-sm">
        <ResourceIcon kind={referenceForModel(model)} />
      </span>
      <Link to={to} className="co-resource-item__resource-name">
        {model.labelKey ? t(model.labelKey) : model.kind}
      </Link>
    </span>
  );
};
const APIResourceLink = connect<APIResourceLinkStateProps, {}, APIResourceLinkOwnProps>(
  mapStateToProps,
)(APIResourceLink_);

const EmptyAPIResourcesMsg: React.FC<{}> = () => {
  const { t } = useTranslation();
  return <EmptyBox label={t('public~API resources')} />;
};

const Group: React.FC<{ value: string }> = ({ value }) => {
  if (!value) {
    return <>-</>;
  }

  const [first, ...rest] = value.split('.');
  return _.isEmpty(rest) ? (
    <>{value}</>
  ) : (
    <span className="co-break-word">
      {first}
      <span className="pf-v6-u-text-color-subtle">.{rest.join('.')}</span>
    </span>
  );
};

const tableClasses = [
  'pf-v6-u-w-25-on-2xl',
  'pf-v6-u-w-16-on-2xl',
  'pf-v6-u-w-16-on-lg pf-v6-u-w-10-on-2xl',
  'pf-m-hidden pf-m-visible-on-xl pf-v6-u-w-16-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
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
      title: model.namespaced ? i18next.t('public~true') : i18next.t('public~false'),
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
  const { t } = useTranslation();
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
    { [ALL]: t('public~All groups'), '': t('public~No group') },
  );
  const [isExactSearch] = useExactSearch();
  const matchFn: Function = isExactSearch ? exactMatch : fuzzyCaseInsensitive;

  const groupSpacer = new Set<string>();
  if (sortedGroups.length) {
    groupSpacer.add(sortedGroups[0]);
  }

  const autocompleteGroups = (text: string, _item: string, key: string): boolean => {
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
    { [ALL]: t('public~All versions') },
  );

  const versionSpacer = new Set<string>();
  if (sortedVersions.length) {
    versionSpacer.add(sortedVersions[0]);
  }

  const scopeOptions = {
    [ALL]: t('public~All scopes'),
    cluster: t('public~Cluster'),
    namespace: t('public~Namespace'),
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
      return matchFn(textFilter, kind);
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

  const APIResourceHeader = () => [
    {
      title: t('public~Kind'),
      sortField: 'kind',
      transforms: [sortable],
      props: { className: tableClasses[0] },
    },
    {
      title: t('public~Group'),
      sortField: 'apiGroup',
      transforms: [sortable],
      props: { className: tableClasses[1] },
    },
    {
      title: t('public~Version'),
      sortField: 'apiVersion',
      transforms: [sortable],
      props: { className: tableClasses[2] },
    },
    {
      title: t('public~Namespaced'),
      sortField: 'namespaced',
      transforms: [sortable],
      props: { className: tableClasses[3] },
    },
    {
      title: t('public~Description'),
      props: { className: tableClasses[4] },
    },
  ];

  return (
    <PaneBody>
      <Toolbar className="pf-m-toggle-group-container">
        <ToolbarContent>
          <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="md">
            <ToolbarItem>
              <Dropdown
                autocompleteFilter={autocompleteGroups}
                items={groupOptions}
                onChange={onGroupSelected}
                selectedKey={groupFilter}
                spacerBefore={groupSpacer}
                title={groupOptions[groupFilter]}
                dropDownClassName="dropdown--full-width"
              />
            </ToolbarItem>
            <ToolbarItem>
              <Dropdown
                items={versionOptions}
                onChange={onVersionSelected}
                selectedKey={versionFilter}
                spacerBefore={versionSpacer}
                title={versionOptions[versionFilter]}
                dropDownClassName="dropdown--full-width"
              />
            </ToolbarItem>
            <ToolbarItem>
              <Dropdown
                items={scopeOptions}
                onChange={onScopeSelected}
                selectedKey={scopeFilter}
                spacerBefore={scopeSpacer}
                title={scopeOptions[scopeFilter]}
                dropDownClassName="dropdown--full-width"
              />
            </ToolbarItem>
          </ToolbarToggleGroup>
          <ToolbarItem>
            <TextFilter
              value={textFilter}
              label={t('public~by kind')}
              onChange={(_event, value) => setTextFilter(value)}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table
        EmptyMsg={EmptyAPIResourcesMsg}
        Header={APIResourceHeader}
        Rows={APIResourceRows}
        aria-label={t('public~API resources')}
        data={sortedResources}
        loaded={!!models.size}
        virtualize={false}
      />
    </PaneBody>
  );
});
APIResourcesList.displayName = 'APIResourcesList';

export const APIExplorerPage: React.FC<{}> = () => {
  const { t } = useTranslation();
  const title = t('public~API Explorer');
  return (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading title={title} />
      <APIResourcesList />
    </>
  );
};
APIExplorerPage.displayName = 'APIExplorerPage';

const APIResourceDetails: React.FC<APIResourceTabProps> = ({ customData: { kindObj } }) => {
  const { kind, apiGroup, apiVersion, namespaced, verbs, shortNames } = kindObj;
  const description = getResourceDescription(kindObj);
  const { t } = useTranslation();
  return (
    <PaneBody>
      <DescriptionList>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('public~Kind')}</DescriptionListTerm>
          <DescriptionListDescription>{kind}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('public~API group')}</DescriptionListTerm>
          <DescriptionListDescription className="co-select-to-copy">
            {apiGroup || '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('public~API version')}</DescriptionListTerm>
          <DescriptionListDescription>{apiVersion}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('public~Namespaced')}</DescriptionListTerm>
          <DescriptionListDescription>
            {namespaced ? t('public~true') : t('public~false')}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('public~Verbs')}</DescriptionListTerm>
          <DescriptionListDescription>{verbs.join(', ')}</DescriptionListDescription>
        </DescriptionListGroup>
        {shortNames && (
          <DescriptionListGroup>
            <DescriptionListTermHelp
              text={t('public~Short names')}
              textHelp={t('public~Short names can be used to match this resource on the CLI.')}
            />
            <DescriptionListDescription>{shortNames.join(', ')}</DescriptionListDescription>
          </DescriptionListGroup>
        )}
        {description && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Description')}</DescriptionListTerm>
            <DescriptionListDescription className="co-break-word co-pre-wrap">
              <LinkifyExternal>{description}</LinkifyExternal>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
    </PaneBody>
  );
};

const scrollTop = () => (document.getElementById('content-scrollable').scrollTop = 0);
const APIResourceSchema: React.FC<APIResourceTabProps> = ({ customData: { kindObj } }) => {
  return (
    <PaneBody>
      <ExploreType kindObj={kindObj} scrollTop={scrollTop} />
    </PaneBody>
  );
};

const APIResourceInstances: React.FC<APIResourceTabProps> = ({
  customData: { kindObj, namespace },
}) => {
  const resourceListPageExtensions = useExtensions<ResourceListPage>(isResourceListPage);
  const dynamicResourceListPageExtensions = useExtensions<DynamicResourceListPage>(
    isDynamicResourceListPage,
  );
  const componentLoader = getResourceListPages(
    resourceListPageExtensions,
    dynamicResourceListPageExtensions,
  ).get(referenceForModel(kindObj), () => Promise.resolve(DefaultPage));
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
      <span className="pf-v6-u-text-color-subtle">{first}:</span>
      {rest.join(':')}
    </>
  ) : (
    <>{value}</>
  );
};

const EmptyAccessReviewMsg: React.FC<{}> = () => {
  const { t } = useTranslation();
  return <EmptyBox label={t('public~Subjects')} />;
};

const APIResourceAccessReview: React.FC<APIResourceTabProps> = ({
  customData: { kindObj, namespace },
}) => {
  const { apiGroup, apiVersion, namespaced, plural, verbs } = kindObj;
  const [searchParams] = useSearchParams();

  // state
  const [verb, setVerb] = React.useState(_.first(verbs));
  const [filter, setFilter] = React.useState('');
  const [showUsers, setShowUsers] = React.useState(true);
  const [showGroups, setShowGroups] = React.useState(true);
  const [showServiceAccounts, setShowServiceAccounts] = React.useState(false);
  const [accessResponse, setAccessResponse] = React.useState<ResourceAccessReviewResponse>();
  const [error, setError] = React.useState<APIError>();
  const { t } = useTranslation();

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
    k8sCreate(accessReviewModel, req, { ns: namespace }).then(setAccessResponse).catch(setError);
  }, [apiGroup, apiVersion, plural, namespace, verb]);

  if (error) {
    return <LoadError label={t('public~Access review')}>{error.message}</LoadError>;
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
  const orderBy = searchParams.get('orderBy');
  const sortByParam = searchParams.get('sortBy');
  const sortBy = sortByParam === 'Type' ? 'type' : 'name';
  const sortedData = _.orderBy(filteredData, [sortBy], [orderBy]);

  const AccessTableHeader = () => [
    {
      title: t('public~Subject'),
      sortField: 'name',
      transforms: [sortable],
    },
    {
      title: t('public~Type'),
      sortField: 'type',
      transforms: [sortable],
    },
  ];

  const getSubjectTypeLabel = (type: string) => {
    switch (type) {
      case 'User':
        return t('public~User');
      case 'Group':
        return t('public~Group');
      case 'ServiceAccount':
        return t('public~ServiceAccount');
      default:
        return type;
    }
  };

  const AccessTableRows = () =>
    sortedData.map((subject) => [
      {
        title: (
          <span className="co-break-word co-select-to-copy">
            <Subject value={subject.name} />
          </span>
        ),
      },
      {
        title: getSubjectTypeLabel(subject.type),
      },
    ]);

  // event handlers
  const toggleShowUsers = (e: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    setShowUsers(checked);
  };
  const toggleShowGroups = (e: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    setShowGroups(checked);
  };
  const toggleShowServiceAccounts = (e: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    setShowServiceAccounts(checked);
  };
  const onSelectAll = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowUsers(true);
    setShowGroups(true);
    setShowServiceAccounts(true);
  };

  return (
    <>
      <PaneBody>
        <Flex className="pf-v6-u-mb-lg">
          <FlexItem>
            <Dropdown
              items={verbOptions}
              onChange={(v: K8sVerb) => setVerb(v)}
              selectedKey={verb}
              titlePrefix={t('public~Verb')}
            />
          </FlexItem>
          <FlexItem align={{ default: 'alignRight' }}>
            <TextFilter
              defaultValue={filter}
              label={t('public~by subject')}
              onChange={(_event, val) => setFilter(val)}
            />
          </FlexItem>
        </Flex>
        <RowFilter
          allSelected={allSelected}
          itemCount={itemCount}
          selectedCount={selectedCount}
          onSelectAll={onSelectAll}
        >
          <Flex>
            <FlexItem>
              <Switch
                id="user-switch"
                label={t('public~{{count}} User', { count: users.length })}
                isChecked={showUsers}
                onChange={toggleShowUsers}
                ouiaId="UserSwitch"
              />
            </FlexItem>
            <FlexItem>
              <Switch
                id="group-switch"
                label={t('public~{{count}} Group', { count: groups.length })}
                isChecked={showGroups}
                onChange={toggleShowGroups}
                ouiaId="GroupSwitch"
              />
            </FlexItem>
            <FlexItem>
              <Switch
                id="service-account-switch"
                label={t('public~{{count}} ServiceAccount', { count: serviceAccounts.length })}
                isChecked={showServiceAccounts}
                onChange={toggleShowServiceAccounts}
                ouiaId="ServiceAccountSwitch"
              />
            </FlexItem>
          </Flex>
        </RowFilter>
        <p className="co-m-pane__explanation">
          {namespaced &&
            namespace &&
            t(
              'public~The following subjects can {{verb}} {{plural}} in namespace {{ namespace }}',
              { verb, plural, namespace },
            )}
          {namespaced &&
            !namespace &&
            t('public~The following subjects can {{verb}} {{plural}} in all namespaces', {
              verb,
              plural,
            })}
          {!namespaced &&
            t('public~The following subjects can {{verb}} {{plural}} at the cluster scope', {
              verb,
              plural,
            })}
        </p>
        <Table
          EmptyMsg={EmptyAccessReviewMsg}
          Header={AccessTableHeader}
          Rows={AccessTableRows}
          aria-label={t('public~API resources')}
          data={sortedData}
          loaded
          virtualize={false}
        />
      </PaneBody>
    </>
  );
};

const APIResourcePage_ = (props) => {
  const params = useParams();
  const location = useLocation();

  const kind: string = props.kind || params?.plural;
  const kindObj = getK8sModel(props.k8s, kind);
  const kindsInFlight = props.k8s.getIn(['RESOURCES', 'inFlight']);

  const namespace = kindObj?.namespaced ? params.ns : undefined;
  const { t } = useTranslation();

  const canCreateResourceAccessReview = useAccessReview({
    group: namespace
      ? LocalResourceAccessReviewsModel.apiGroup
      : ResourceAccessReviewsModel.apiGroup,
    resource: namespace
      ? LocalResourceAccessReviewsModel.plural
      : ResourceAccessReviewsModel.plural,
    namespace,
    verb: 'create',
  });

  if (!kindObj) {
    return kindsInFlight ? <LoadingBox /> : <ErrorPage404 />;
  }

  const breadcrumbs = [
    {
      name: t('public~Explore'),
      path: '/api-explorer',
    },
    {
      name: t('public~Resource details'),
      path: location.pathname,
    },
  ];

  const pages: Page[] = [
    {
      href: '',
      // t('public~Details')
      nameKey: 'public~Details',
      component: APIResourceDetails,
    },
    {
      href: 'schema',
      // t('public~Schema')
      nameKey: 'public~Schema',
      component: APIResourceSchema,
    },
  ];

  if (_.isEmpty(kindObj.verbs) || kindObj.verbs.includes('list')) {
    pages.push({
      href: 'instances',
      // t('public~Instances')
      nameKey: 'public~Instances',
      component: APIResourceInstances,
    });
  }

  if (props.flags[FLAGS.OPENSHIFT] && canCreateResourceAccessReview) {
    pages.push({
      href: 'access',
      // t('public~Access review')
      nameKey: 'public~Access review',
      component: APIResourceAccessReview,
    });
  }

  const titleProviderValues = {
    telemetryPrefix: kindObj?.kind,
    titlePrefix: getTitleForNodeKind(kindObj?.kind),
  };

  return (
    <>
      <PageTitleContext.Provider value={titleProviderValues}>
        <ScrollToTopOnMount />
        <PageHeading
          title={<div data-test-id="api-explorer-resource-title">{kindObj.label}</div>}
          breadcrumbs={breadcrumbs}
        />
        <HorizontalNav pages={pages} customData={{ kindObj, namespace }} noStatusBox />
      </PageTitleContext.Provider>
    </>
  );
};

const k8StateToProps = ({ k8s }) => ({
  k8s,
});

export const APIResourcePage = connect(k8StateToProps)(
  connectToFlags(FLAGS.OPENSHIFT)(APIResourcePage_),
);

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
