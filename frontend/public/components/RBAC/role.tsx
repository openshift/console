import type { FC } from 'react';
import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import * as fuzzy from 'fuzzysearch';
import i18next from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router';
import type { Location } from 'react-router';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewCell,
  ConsoleDataViewColumn,
  GetDataViewRows,
  ResourceFilters,
  WatchK8sResource,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { DASH } from '@console/shared/src/constants/ui';
import { RoleModel, RoleBindingModel } from '../../models';
import type { K8sKind, K8sModel, K8sResourceKind } from '../../module/k8s';
import { referenceForModel, referenceFor } from '../../module/k8s';
import { DetailsForKind } from '../default-resource';
import { DetailsPage } from '../factory/details';
import { MultiListPage } from '../factory/list-page';
import { tableFilters } from '../factory/table-filters';
import { TextFilter } from '../factory/text-filter';
import { getLastNamespace } from '../utils/breadcrumbs';
import { SectionHeading } from '../utils/headings';
import { navFactory } from '../utils/horizontal-nav';
import { ResourceLink, resourceListPathFromModel } from '../utils/resource-link';
import { LoadingBox } from '../utils/status-box';
import { BindingName, flatten as bindingsFlatten } from './bindings';
import type { BindingKind } from './bindings';
import { roleKind, roleType } from './role-type';
import { RulesList } from './rules';
import type { RoleKind } from './rules';

const tableColumnInfo = [{ id: 'name' }, { id: 'namespace-always-show' }, { id: 'actions' }];

const getDataViewRows: GetDataViewRows<RoleKind> = (data, columns) =>
  data.map(({ obj: role }) => {
    const rowCells: { [columnId: string]: Omit<ConsoleDataViewCell, 'id'> } = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={roleKind(role)}
            name={role.metadata.name}
            namespace={role.metadata.namespace}
          />
        ),
      },
      [tableColumnInfo[1].id]: {
        cell: role.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={role.metadata.namespace} />
        ) : (
          i18next.t('public~All namespaces')
        ),
      },
      [tableColumnInfo[2].id]: {
        cell: <LazyActionMenu context={{ [referenceFor(role)]: role }} />,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || null;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });

const Details: FC<{ obj: RoleKind }> = ({ obj: ruleObj }) => {
  const { t } = useTranslation('public');
  const [ruleFilter, setRuleFilter] = useState('');

  const { creationTimestamp, name, namespace } = ruleObj.metadata;

  let { rules } = ruleObj;
  if (ruleFilter) {
    const fuzzyCaseInsensitive = (a: string, b: string) => fuzzy(_.toLower(a), _.toLower(b));
    const searchKeys = ['nonResourceURLs', 'resources', 'verbs', 'resourceNames'];
    rules = rules?.filter((rule) =>
      searchKeys.some((k) => _.some(rule[k], (v) => fuzzyCaseInsensitive(ruleFilter, v))),
    );
  }

  return (
    <div>
      <PaneBody>
        <SectionHeading text={t('Role details')} />
        <Grid hasGutter>
          <GridItem span={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Role name')}</DescriptionListTerm>
                <DescriptionListDescription>{name}</DescriptionListDescription>
              </DescriptionListGroup>
              {namespace && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Namespace')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ResourceLink kind="Namespace" name={namespace} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </GridItem>
          <GridItem span={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Created at')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Timestamp timestamp={creationTimestamp} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('Rules')} />
        <div>
          {/* This page is temporarily disabled until we update the safe resources list.
          <div>
            <Link to={addHref(name, namespace)}>
              <Button variant="primary">{t('Add Rule')}</Button>
            </Link>
          </div>
          */}
          <TextFilter
            label={t('rules by action or resource')}
            onChange={(_e, val) => setRuleFilter(val)}
          />
        </div>
        <RulesList rules={rules ?? []} name={name} namespace={namespace} />
      </PaneBody>
    </div>
  );
};

const bindingsTableColumnInfo = [
  { id: 'name' },
  { id: 'subjectKind' },
  { id: 'subjectName' },
  { id: 'namespace-always-show' },
];

const getBindingsDataViewRows: GetDataViewRows<BindingKind> = (data, columns) =>
  data.map(({ obj: binding }) => {
    const rowCells: { [columnId: string]: Omit<ConsoleDataViewCell, 'id'> } = {
      [bindingsTableColumnInfo[0].id]: {
        cell: <BindingName binding={binding} />,
      },
      [bindingsTableColumnInfo[1].id]: {
        cell: binding.subject.kind,
      },
      [bindingsTableColumnInfo[2].id]: {
        cell: binding.subject.name,
      },
      [bindingsTableColumnInfo[3].id]: {
        cell: binding.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={binding.metadata.namespace} />
        ) : (
          i18next.t('public~All namespaces')
        ),
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });

const useBindingsColumns = (): ConsoleDataViewColumn<BindingKind>[] => {
  const { t } = useTranslation('public');
  return useMemo<ConsoleDataViewColumn<BindingKind>[]>(
    () => [
      {
        type: 'name',
        title: t('Name'),
        id: bindingsTableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Subject kind'),
        id: bindingsTableColumnInfo[1].id,
        sort: 'subject.kind',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Subject name'),
        id: bindingsTableColumnInfo[2].id,
        sort: 'subject.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Namespace'),
        id: bindingsTableColumnInfo[3].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
    ],
    [t],
  );
};

const BindingsListComponent: FC<BindingsListComponentProps> = (props) => {
  const { t } = useTranslation('public');
  const columns = useBindingsColumns();

  const { data, loaded, staticFilters } = props;

  // Apply staticFilters to filter the data using table filters
  const filteredData = useMemo(() => {
    if (!staticFilters || !data) {
      return data;
    }

    const filtersMap = tableFilters(false); // false for fuzzy search

    // Convert staticFilters to array format if it's an object
    const filtersArray = Array.isArray(staticFilters) ? staticFilters : [staticFilters];

    return data.filter((binding) =>
      filtersArray.every((filter) => {
        const filterKey = Object.keys(filter)[0];
        const filterValue = filter[filterKey];

        // Use the table filter function if it exists. Static filters pass plain string
        // values, while row-filter functions expect a FilterValue object.
        const filterFn = filtersMap[filterKey] as (value: string, obj: BindingKind) => boolean;
        if (filtersMap[filterKey]) {
          return filterFn(filterValue, binding);
        }
        return true;
      }),
    );
  }, [data, staticFilters]);

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        isResizable={false}
        id="console.ui~v1~RoleBindingsForRole"
        data={filteredData}
        loaded={loaded}
        label={t('RoleBindings')}
        columns={columns}
        getDataViewRows={getBindingsDataViewRows}
      />
    </Suspense>
  );
};

const BindingsForRolePage: FC<{ obj: RoleKind }> = (props) => {
  const { name, ns } = useParams();
  const {
    obj: { kind },
  } = props;
  const resources: WatchK8sResource[] = [{ kind: 'RoleBinding', namespaced: true }];
  if (!ns) {
    resources.push({ kind: 'ClusterRoleBinding', namespaced: false, optional: true });
  }

  const { t } = useTranslation('public');
  return (
    <MultiListPage
      canCreate
      createButtonText={t('Create binding')}
      createProps={{
        to: `/k8s/${
          ns ? `ns/${ns}` : 'cluster'
        }/rolebindings/~new?rolekind=${kind}&rolename=${name}${ns ? `&namespace=${ns}` : ''}`,
      }}
      ListComponent={BindingsListComponent}
      staticFilters={[
        // Some bindings have a name that needs to be decoded (e.g., `system%3Aimage-builder`)
        { 'role-binding-roleRef-name': decodeURIComponent(name) },
        { 'role-binding-roleRef-kind': kind },
      ]}
      resources={resources}
      namespace={ns}
      flatten={bindingsFlatten}
      omitFilterToolbar
    />
  );
};

const getBreadcrumbs = (model: K8sKind, kindObj: K8sKind, location: Location) => {
  const lastNamespace = getLastNamespace();
  return [
    {
      name: model.labelPluralKey ? i18next.t(model.labelPluralKey) : model.labelPlural,
      path: resourceListPathFromModel(
        model,
        !lastNamespace || lastNamespace === ALL_NAMESPACES_KEY ? null : lastNamespace,
      ),
    },
    {
      name: i18next.t('public~{{kind}} details', {
        kind: kindObj.labelKey ? i18next.t(kindObj.labelKey) : kindObj.label,
      }),
      path: `${location.pathname}`,
    },
  ];
};

export const RolesDetailsPage: FC<{ kindObj: K8sKind }> = (props) => {
  const location = useLocation();
  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(props.kindObj)}
      customActionMenu={(_k8sObj: K8sModel, obj: K8sResourceKind) => (
        <LazyActionMenu
          context={{ [referenceForModel(props.kindObj)]: obj }}
          variant={ActionMenuVariant.DROPDOWN}
        />
      )}
      pages={[
        navFactory.details(Details),
        navFactory.editYaml(),
        {
          href: 'bindings',
          // t('public~RoleBindings')
          nameKey: 'public~RoleBindings',
          component: BindingsForRolePage,
        },
      ]}
      breadcrumbsFor={() => getBreadcrumbs(RoleModel, props.kindObj, location)}
    />
  );
};

export const ClusterRoleBindingsDetailsPage: FC<{ kindObj: K8sKind }> = (props) => {
  const pages = [navFactory.details(DetailsForKind), navFactory.editYaml()];
  const location = useLocation();

  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(props.kindObj)}
      customActionMenu={(_k8sObj: K8sModel, obj: K8sResourceKind) => (
        <LazyActionMenu
          context={{ [referenceForModel(props.kindObj)]: obj }}
          variant={ActionMenuVariant.DROPDOWN}
        />
      )}
      pages={pages}
      breadcrumbsFor={() => getBreadcrumbs(RoleBindingModel, props.kindObj, location)}
    />
  );
};

const useRolesColumns = (): {
  columns: ConsoleDataViewColumn<RoleKind>[];
} => {
  const { t } = useTranslation('public');

  const columns = useMemo<ConsoleDataViewColumn<RoleKind>[]>(
    () => [
      {
        type: 'name',
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      { type: 'actions', id: tableColumnInfo[2].id },
    ],
    [t],
  );

  return { columns };
};

const useRoleFilterOptions = () => {
  const { t } = useTranslation('public');
  return useMemo(
    () => [
      {
        value: 'cluster',
        label: t('Cluster-wide Roles'),
      },
      {
        value: 'namespace',
        label: t('Namespace Roles'),
      },
      {
        value: 'system',
        label: t('System Roles'),
      },
    ],
    [t],
  );
};

interface RoleFilters extends ResourceFilters {
  'role-kind': string[];
}

const initialFilters: Partial<RoleFilters> = { 'role-kind': [] };

const RolesList: FC<RolesListProps> = (props) => {
  const { t } = useTranslation('public');
  const { data, loaded } = props;
  const { columns } = useRolesColumns();
  const roleFilterOptions = useRoleFilterOptions();

  const additionalFilterNodes = useMemo(
    () => [
      <DataViewCheckboxFilter
        key="role-kind"
        filterId="role-kind"
        title={t('Role')}
        placeholder={t('Filter by role')}
        options={roleFilterOptions}
      />,
    ],
    [roleFilterOptions, t],
  );

  const matchesAdditionalFilters = useCallback(
    (resource: RoleKind, filters: RoleFilters) =>
      filters['role-kind'].length === 0 || filters['role-kind'].includes(roleType(resource)),
    [],
  );

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<RoleKind, undefined, RoleFilters>
        {...props}
        id={RoleModel}
        data={data}
        loaded={loaded}
        label={t('Roles')}
        columns={columns}
        getDataViewRows={getDataViewRows}
        initialFilters={initialFilters}
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
      />
    </Suspense>
  );
};

export const RolesPage: FC<RolesPageProps> = ({ namespace, mock, showTitle }) => {
  const { t } = useTranslation('public');
  const location = useLocation();

  // Track which filter is selected from URL params
  const [selectedFilters, setSelectedFilters] = useState(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('rowFilter-role-kind');
    return filterParam ? filterParam.split(',') : [];
  });

  const createNS = namespace || 'default';
  const accessReview = {
    model: RoleModel,
    namespace: createNS,
  };

  // Dynamically determine which resources to fetch
  const resources = useMemo(() => {
    const hasCluster = selectedFilters.includes('cluster');
    const hasNamespaceOrSystem =
      selectedFilters.includes('namespace') || selectedFilters.includes('system');

    const resourcesList: WatchK8sResource[] = [];

    // Only fetch Role if namespace/system filter selected OR no filters selected
    if (hasNamespaceOrSystem || selectedFilters.length === 0) {
      resourcesList.push({ kind: 'Role', namespaced: true, optional: true });
    }

    // Only fetch ClusterRole if cluster filter selected OR no filters selected
    if (hasCluster || selectedFilters.length === 0) {
      resourcesList.push({ kind: 'ClusterRole', namespaced: false, optional: true });
    }

    return resourcesList;
  }, [selectedFilters]);

  // Update state when URL params change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('rowFilter-role-kind');
    const newFilters = filterParam ? filterParam.split(',') : [];

    const sortedNew = [...newFilters].sort();
    const sortedSelected = [...selectedFilters].sort();

    if (!_.isEqual(sortedNew, sortedSelected)) {
      setSelectedFilters(newFilters);
    }
  }, [location.search, selectedFilters]);

  return (
    <MultiListPage
      ListComponent={RolesList}
      canCreate
      showTitle={showTitle}
      namespace={namespace}
      createAccessReview={accessReview}
      createButtonText={t('Create Role')}
      createProps={{ to: `/k8s/ns/${createNS}/roles/~new` }}
      flatten={(resourcesData) => _.flatMap(resourcesData, 'data').filter((r) => !!r)}
      resources={resources}
      title={t('Roles')}
      mock={mock}
      omitFilterToolbar
    />
  );
};

interface BindingsListComponentProps {
  data: BindingKind[];
  loaded: boolean;
  loadError?: unknown;
  mock?: boolean;
  staticFilters?: { [key: string]: string } | { [key: string]: string }[];
}

interface RolesListProps {
  data: RoleKind[];
  loaded: boolean;
  loadError?: unknown;
  mock?: boolean;
}

interface RolesPageProps {
  namespace?: string;
  mock?: boolean;
  showTitle?: boolean;
}
