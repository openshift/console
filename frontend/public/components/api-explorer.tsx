import { FC, MouseEvent, useEffect, useMemo, useRef, FormEvent, useState } from 'react';
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
  Pagination,
  Bullseye,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

import { ALL_NAMESPACES_KEY, FLAGS } from '@console/shared/src/constants/common';
import { APIError } from '@console/shared/src/types/resource';
import { getTitleForNodeKind } from '@console/shared/src/utils/utils';
import { useExactSearch } from '@console/app/src/components/user-preferences/search/useExactSearch';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import { Page } from '@console/internal/components/utils/horizontal-nav';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DataView, DataViewTable, useDataViewPagination } from '@patternfly/react-data-view';
import { InnerScrollContainer, Tbody, Tr, Td } from '@patternfly/react-table';

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
import type { RootState } from '../redux';
import { RowFilter } from './row-filter';
import { DefaultPage } from './default-resource';
import { TextFilter } from './factory';
import { exactMatch, fuzzyCaseInsensitive } from './factory/table-filters';
import { getResourceListPages } from './resource-pages';
import { ExploreType } from './sidebars/explore-type-sidebar';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { AsyncComponent } from './utils/async';
import { LoadError, LoadingBox } from './utils/status-box';
import { HorizontalNav } from './utils/horizontal-nav';
import { LinkifyExternal } from './utils/link';
import { removeQueryArgument, setQueryArgument } from './utils/router';
import { ResourceIcon } from './utils/resource-icon';
import { ScrollToTopOnMount } from './utils/scroll-to-top-on-mount';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import {
  ResourceListPage,
  isResourceListPage,
} from '@console/dynamic-plugin-sdk/src/extensions/pages';
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

const APIResourceLink_: FC<APIResourceLinkStateProps & APIResourceLinkOwnProps> = ({
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

const Group: FC<{ value: string }> = ({ value }) => {
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
const stateToProps = ({ k8s }) => ({
  models: k8s.getIn(['RESOURCES', 'models']),
});

const BodyEmpty: FC<{ label: string; colSpan: number }> = ({ label, colSpan }) => {
  const { t } = useTranslation();
  return (
    <Tbody>
      <Tr>
        <Td colSpan={colSpan}>
          <Bullseye>
            {label ? t('public~No {{label}} found', { label }) : t('public~None found')}
          </Bullseye>
        </Td>
      </Tr>
    </Tbody>
  );
};

const APIResourcesList = compose(
  withRouter,
  connect<APIResourcesListPropsFromState>(stateToProps),
)(({ models, location }) => {
  const ALL = '#all#';
  const GROUP_PARAM = 'g';
  const VERSION_PARAM = 'v';
  const TEXT_FILTER_PARAM = 'q';
  const SCOPE_PARAM = 's';
  const SORT_BY_PARAM = 'sortBy';
  const ORDER_BY_PARAM = 'orderBy';
  const search = new URLSearchParams(location.search);
  // Differentiate between an empty group and an unspecified param.
  const groupFilter = search.has(GROUP_PARAM) ? search.get(GROUP_PARAM) : ALL;
  const versionFilter = search.get(VERSION_PARAM) || ALL;
  const textFilter = search.get(TEXT_FILTER_PARAM) || '';
  const scopeFilter = search.get(SCOPE_PARAM) || ALL;
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Pagination
  const pagination = useDataViewPagination({
    perPage: 50,
    searchParams,
    setSearchParams,
  });

  // Sorting state from URL
  const sortByParam = search.get(SORT_BY_PARAM) || '0';
  const orderByParam = search.get(ORDER_BY_PARAM) || 'asc';
  const sortBy = useMemo(
    () => ({
      index: parseInt(sortByParam, 10),
      direction: orderByParam === 'desc' ? 'desc' : ('asc' as 'asc' | 'desc'),
    }),
    [sortByParam, orderByParam],
  );

  // Reset pagination to page 1 when filters change
  const prevFiltersRef = useRef({ groupFilter, versionFilter, textFilter, scopeFilter });
  useEffect(() => {
    const currentFilters = { groupFilter, versionFilter, textFilter, scopeFilter };
    const prevFilters = prevFiltersRef.current;
    const filtersChanged =
      currentFilters.groupFilter !== prevFilters.groupFilter ||
      currentFilters.versionFilter !== prevFilters.versionFilter ||
      currentFilters.textFilter !== prevFilters.textFilter ||
      currentFilters.scopeFilter !== prevFilters.scopeFilter;

    if (filtersChanged && pagination.page > 1) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', '1');
        return newParams;
      });
    }

    prevFiltersRef.current = currentFilters;
  }, [groupFilter, versionFilter, textFilter, scopeFilter, pagination.page, setSearchParams]);

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

  // Sorting
  const getSortableValue = (model: K8sKind, columnIndex: number) => {
    switch (columnIndex) {
      case 0: // Kind
        return model.kind;
      case 1: // Group
        return model.apiGroup || '';
      case 2: // Version
        return model.apiVersion;
      case 3: // Namespaced
        return model.namespaced ? 'true' : 'false';
      case 4: // Description
        return getResourceDescription(model);
      default:
        return '';
    }
  };

  const sortedResources = useMemo(() => {
    const sorted = [...filteredResources.toArray()];

    // Check if user has manually sorted (sortBy params exist in URL)
    const hasUserSort = sortByParam !== '0' || orderByParam !== 'asc';

    if (hasUserSort) {
      // User-initiated sort
      sorted.sort((a, b) => {
        const aValue = getSortableValue(a, sortBy.index);
        const bValue = getSortableValue(b, sortBy.index);
        const compareResult = aValue.localeCompare(bValue);
        return sortBy.direction === 'asc' ? compareResult : -compareResult;
      });
    } else {
      // Default sort: resources with API group at top, then by version, then by kind
      sorted.sort((a, b) => {
        // First sort by presence of API group (resources with apiGroup come first)
        const aGroup = a.apiGroup || '~'; // '~' sorts after alphanumeric
        const bGroup = b.apiGroup || '~';
        const groupCompare = aGroup.localeCompare(bGroup);
        if (groupCompare !== 0) {
          return groupCompare;
        }

        // Then by version
        const versionCompare = a.apiVersion.localeCompare(b.apiVersion);
        if (versionCompare !== 0) {
          return versionCompare;
        }

        // Finally by kind
        return a.kind.localeCompare(b.kind);
      });
    }

    return sorted;
  }, [filteredResources, sortBy, sortByParam, orderByParam]);

  const paginatedResources = useMemo(() => {
    return sortedResources.slice(
      (pagination.page - 1) * pagination.perPage,
      (pagination.page - 1) * pagination.perPage + pagination.perPage,
    );
  }, [sortedResources, pagination.page, pagination.perPage]);

  const onSort = (_event: MouseEvent, index: number, direction: 'asc' | 'desc') => {
    setQueryArgument(SORT_BY_PARAM, String(index));
    setQueryArgument(ORDER_BY_PARAM, direction);
  };

  const bodyEmpty = useMemo(() => <BodyEmpty label={t('public~API resources')} colSpan={5} />, [t]);

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
    <PaneBody>
      <Toolbar className="pf-m-toggle-group-container">
        <ToolbarContent>
          <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="md">
            <ToolbarItem>
              <ConsoleSelect
                autocompleteFilter={autocompleteGroups}
                items={groupOptions}
                onChange={onGroupSelected}
                selectedKey={groupFilter}
                spacerBefore={groupSpacer}
                title={groupOptions[groupFilter]}
                alwaysShowTitle
                isFullWidth
              />
            </ToolbarItem>
            <ToolbarItem>
              <ConsoleSelect
                items={versionOptions}
                onChange={onVersionSelected}
                selectedKey={versionFilter}
                spacerBefore={versionSpacer}
                title={versionOptions[versionFilter]}
                alwaysShowTitle
                isFullWidth
              />
            </ToolbarItem>
            <ToolbarItem>
              <ConsoleSelect
                items={scopeOptions}
                onChange={onScopeSelected}
                selectedKey={scopeFilter}
                spacerBefore={scopeSpacer}
                title={scopeOptions[scopeFilter]}
                alwaysShowTitle
                isFullWidth
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
          <ToolbarItem variant="pagination">
            <Pagination itemCount={sortedResources.length} {...pagination} isCompact />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <DataView
        activeState={!models.size ? 'loading' : sortedResources.length === 0 ? 'empty' : undefined}
      >
        <InnerScrollContainer>
          <DataViewTable
            aria-label={t('public~API resources')}
            columns={[
              {
                cell: t('public~Kind'),
                props: {
                  modifier: 'nowrap',
                  width: 20,
                  sort: {
                    sortBy,
                    onSort,
                    columnIndex: 0,
                  },
                },
              },
              {
                cell: t('public~Group'),
                props: {
                  modifier: 'nowrap',
                  width: 15,
                  sort: {
                    sortBy,
                    onSort,
                    columnIndex: 1,
                  },
                },
              },
              {
                cell: t('public~Version'),
                props: {
                  modifier: 'nowrap',
                  sort: {
                    sortBy,
                    onSort,
                    columnIndex: 2,
                  },
                },
              },
              {
                cell: t('public~Namespaced'),
                props: {
                  modifier: 'nowrap',
                  sort: {
                    sortBy,
                    onSort,
                    columnIndex: 3,
                  },
                },
              },
              { cell: t('public~Description'), props: { modifier: 'nowrap' } },
            ]}
            rows={paginatedResources.map((model: K8sKind) => [
              <APIResourceLink key={model.kind} model={model} />,
              <span key="group" className="co-select-to-copy">
                <Group value={model.apiGroup} />
              </span>,
              model.apiVersion,
              model.namespaced ? t('public~true') : t('public~false'),
              <div key="description" className="co-line-clamp">
                {getResourceDescription(model)}
              </div>,
            ])}
            bodyStates={{ empty: bodyEmpty }}
            gridBreakPoint=""
            variant="compact"
            data-test="data-view-table"
          />
        </InnerScrollContainer>
      </DataView>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem variant="pagination">
            <Pagination itemCount={sortedResources.length} {...pagination} variant="bottom" />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    </PaneBody>
  );
});
APIResourcesList.displayName = 'APIResourcesList';

export const APIExplorerPage: FC<{}> = () => {
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

const APIResourceDetails: FC<APIResourceTabProps> = ({ customData: { kindObj } }) => {
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
const APIResourceSchema: FC<APIResourceTabProps> = ({ customData: { kindObj } }) => {
  return (
    <PaneBody>
      <ExploreType kindObj={kindObj} scrollTop={scrollTop} />
    </PaneBody>
  );
};

const APIResourceInstances: FC<APIResourceTabProps> = ({ customData: { kindObj, namespace } }) => {
  const resourceListPageExtensions = useExtensions<ResourceListPage>(isResourceListPage);
  const componentLoader = getResourceListPages(resourceListPageExtensions).get(
    referenceForModel(kindObj),
    () => Promise.resolve(DefaultPage),
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

const Subject: FC<{ value: string }> = ({ value }) => {
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

const getSubjectTypeLabel = (type: string) => {
  switch (type) {
    case 'User':
      return i18next.t('public~User');
    case 'Group':
      return i18next.t('public~Group');
    case 'ServiceAccount':
      return i18next.t('public~ServiceAccount');
    default:
      return type;
  }
};

const APIResourceAccessReview: FC<APIResourceTabProps> = ({
  customData: { kindObj, namespace },
}) => {
  const { apiGroup, apiVersion, namespaced, plural, verbs } = kindObj;
  const [searchParams, setSearchParams] = useSearchParams();

  // state
  const [verb, setVerb] = useState(_.first(verbs));
  const [filter, setFilter] = useState('');
  const [showUsers, setShowUsers] = useState(true);
  const [showGroups, setShowGroups] = useState(true);
  const [showServiceAccounts, setShowServiceAccounts] = useState(false);
  const [accessResponse, setAccessResponse] = useState<ResourceAccessReviewResponse>();
  const [error, setError] = useState<APIError>();
  const { t } = useTranslation();

  // Pagination
  const pagination = useDataViewPagination({
    perPage: 50,
    searchParams,
    setSearchParams,
  });

  // Sorting state from URL
  const sortByParam = searchParams.get('sortBy') || '0';
  const orderByParam = searchParams.get('orderBy') || 'asc';
  const sortBy = useMemo(
    () => ({
      index: parseInt(sortByParam, 10),
      direction: orderByParam === 'desc' ? 'desc' : ('asc' as 'asc' | 'desc'),
    }),
    [sortByParam, orderByParam],
  );

  // Reset pagination to page 1 when filters change
  const prevFiltersRef = useRef({ verb, filter, showUsers, showGroups, showServiceAccounts });
  useEffect(() => {
    const currentFilters = { verb, filter, showUsers, showGroups, showServiceAccounts };
    const prevFilters = prevFiltersRef.current;
    const filtersChanged =
      currentFilters.verb !== prevFilters.verb ||
      currentFilters.filter !== prevFilters.filter ||
      currentFilters.showUsers !== prevFilters.showUsers ||
      currentFilters.showGroups !== prevFilters.showGroups ||
      currentFilters.showServiceAccounts !== prevFilters.showServiceAccounts;

    if (filtersChanged && pagination.page > 1) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', '1');
        return newParams;
      });
    }

    prevFiltersRef.current = currentFilters;
  }, [verb, filter, showUsers, showGroups, showServiceAccounts, pagination.page, setSearchParams]);

  // perform the access review
  useEffect(() => {
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

  // Prepare data for rendering (must be before early returns to satisfy hooks rules)
  const { users, groups, serviceAccounts, allData, filteredData, paginatedData } = useMemo(() => {
    if (!accessResponse) {
      return {
        users: [],
        groups: [],
        serviceAccounts: [],
        allData: [],
        filteredData: [],
        paginatedData: [],
      };
    }

    const usersList = [];
    const serviceAccountsList = [];
    _.each(accessResponse.users, (name: string) => {
      if (name.startsWith('system:serviceaccount:')) {
        serviceAccountsList.push({ name, type: 'ServiceAccount' });
      } else {
        usersList.push({ name, type: 'User' });
      }
    });
    const groupsList = _.map(accessResponse.groups, (name: string) => ({
      name,
      type: 'Group',
    }));

    // Build data array based on filter switches
    const data = [
      ...(showUsers ? usersList : []),
      ...(showGroups ? groupsList : []),
      ...(showServiceAccounts ? serviceAccountsList : []),
    ];

    // Apply text filter
    const textFiltered = data.filter(({ name }: { name: string }) => fuzzy(filter, name));

    // Apply sorting
    const sorted = [...textFiltered];
    sorted.sort((a, b) => {
      const aValue = sortBy.index === 0 ? a.name : a.type;
      const bValue = sortBy.index === 0 ? b.name : b.type;
      const compareResult = aValue.localeCompare(bValue);
      return sortBy.direction === 'asc' ? compareResult : -compareResult;
    });

    // Apply pagination
    const paginated = sorted.slice(
      (pagination.page - 1) * pagination.perPage,
      (pagination.page - 1) * pagination.perPage + pagination.perPage,
    );

    return {
      users: usersList,
      groups: groupsList,
      serviceAccounts: serviceAccountsList,
      allData: data,
      filteredData: sorted,
      paginatedData: paginated,
    };
  }, [accessResponse, showUsers, showGroups, showServiceAccounts, filter, sortBy, pagination]);

  const onSort = (_event: MouseEvent, index: number, direction: 'asc' | 'desc') => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('sortBy', String(index));
      newParams.set('orderBy', direction);
      return newParams;
    });
  };

  const bodyEmpty = useMemo(() => <BodyEmpty label={t('public~Subjects')} colSpan={2} />, [t]);

  if (error) {
    return <LoadError label={t('public~Access review')}>{error.message}</LoadError>;
  }

  if (!accessResponse) {
    return <LoadingBox />;
  }

  const allSelected = showUsers && showGroups && showServiceAccounts;
  const itemCount = accessResponse.users.length + accessResponse.groups.length;
  const selectedCount = allData.length;

  const verbOptions = _.zipObject(verbs, verbs);

  // event handlers
  const toggleShowUsers = (e: FormEvent<HTMLInputElement>, checked: boolean) => {
    setShowUsers(checked);
  };
  const toggleShowGroups = (e: FormEvent<HTMLInputElement>, checked: boolean) => {
    setShowGroups(checked);
  };
  const toggleShowServiceAccounts = (e: FormEvent<HTMLInputElement>, checked: boolean) => {
    setShowServiceAccounts(checked);
  };
  const onSelectAll = (e: MouseEvent<HTMLButtonElement>) => {
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
            <ConsoleSelect
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
          <FlexItem align={{ default: 'alignRight' }}>
            <Pagination itemCount={filteredData.length} {...pagination} isCompact />
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
        <DataView activeState={filteredData.length === 0 ? 'empty' : undefined}>
          <InnerScrollContainer>
            <DataViewTable
              aria-label={t('public~API resources')}
              columns={[
                {
                  cell: t('public~Subject'),
                  props: {
                    modifier: 'nowrap',
                    sort: {
                      sortBy,
                      onSort,
                      columnIndex: 0,
                    },
                  },
                },
                {
                  cell: t('public~Type'),
                  props: {
                    modifier: 'nowrap',
                    sort: {
                      sortBy,
                      onSort,
                      columnIndex: 1,
                    },
                  },
                },
              ]}
              rows={paginatedData.map((subject) => [
                <Subject key={subject.name} value={subject.name} />,
                getSubjectTypeLabel(subject.type),
              ])}
              bodyStates={{ empty: bodyEmpty }}
              gridBreakPoint=""
              variant="compact"
              data-test="data-view-table"
            />
          </InnerScrollContainer>
        </DataView>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem variant="pagination">
              <Pagination itemCount={filteredData.length} {...pagination} variant="bottom" />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
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
