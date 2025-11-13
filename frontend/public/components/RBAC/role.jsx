import * as _ from 'lodash-es';
import * as React from 'react';
import { Component } from 'react';
import * as fuzzy from 'fuzzysearch';
import { useLocation, useParams } from 'react-router-dom-v5-compat';
import { RoleModel, RoleBindingModel } from '../../models';
import { useTranslation, withTranslation } from 'react-i18next';
import i18next from 'i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { BindingName, flatten as bindingsFlatten } from './bindings';
import { RulesList } from './rules';
import { DetailsPage } from '../factory/details';
import { MultiListPage, TextFilter } from '../factory/list-page';
import {
  ConsoleDataView,
  getNameCellProps,
  actionsCellProps,
  cellIsStickyProps,
  initialFiltersDefault,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { tableFilters } from '../factory/table-filters';
import { Kebab, ResourceKebab } from '../utils/kebab';
import { SectionHeading } from '../utils/headings';
import { ConsoleEmptyState } from '@console/shared/src/components/empty-state';
import { navFactory } from '../utils/horizontal-nav';
import { ResourceLink, resourceListPathFromModel } from '../utils/resource-link';
import { LoadingBox } from '../utils/status-box';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { DetailsForKind } from '../default-resource';
import { getLastNamespace } from '../utils/breadcrumbs';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { DASH } from '@console/shared/src/constants/ui';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';

const { common } = Kebab.factory;

export const isSystemRole = (role) => _.startsWith(role.metadata.name, 'system:');

// const addHref = (name, ns) => ns ? `/k8s/ns/${ns}/roles/${name}/add-rule` : `/k8s/cluster/clusterroles/${name}/add-rule`;

export const roleKind = (role) => (role.metadata.namespace ? 'Role' : 'ClusterRole');

const menuActions = [
  // This page is temporarily disabled until we update the safe resources list.
  // (kind, role) => ({
  //   label: 'Add Rule',
  //   href: addHref(role.metadata.name, role.metadata.namespace),
  // }),
  (kind, role) => ({
    label: i18next.t('public~Add RoleBinding'),
    href: `/k8s/${
      role.metadata.namespace
        ? `ns/${role.metadata.namespace}/rolebindings/~new?rolekind=${roleKind(role)}&rolename=${
            role.metadata.name
          }&namespace=${role.metadata.namespace}`
        : `cluster/rolebindings/~new?rolekind=${roleKind(role)}&rolename=${role.metadata.name}`
    }`,
  }),
  Kebab.factory.Edit,
  Kebab.factory.Delete,
];

const tableColumnInfo = [{ id: 'name' }, { id: 'namespace-always-show' }, { id: 'actions' }];

const getDataViewRows = (data, columns) => {
  return data.map(({ obj: role }) => {
    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={roleKind(role)}
            name={role.metadata.name}
            namespace={role.metadata.namespace}
          />
        ),
        props: getNameCellProps(role.metadata.name),
      },
      [tableColumnInfo[1].id]: {
        cell: role.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={role.metadata.namespace} />
        ) : (
          i18next.t('public~All namespaces')
        ),
      },
      [tableColumnInfo[2].id]: {
        cell: <ResourceKebab actions={menuActions} kind={roleKind(role)} resource={role} />,
        props: actionsCellProps,
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
};

class Details extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.changeFilter = (val) => this.setState({ ruleFilter: val });
  }

  render() {
    const ruleObj = this.props.obj;
    const { creationTimestamp, name, namespace } = ruleObj.metadata;
    const { ruleFilter } = this.state;

    let rules = ruleObj.rules;
    if (ruleFilter) {
      const fuzzyCaseInsensitive = (a, b) => fuzzy(_.toLower(a), _.toLower(b));
      const searchKeys = ['nonResourceURLs', 'resources', 'verbs'];
      rules = rules.filter((rule) =>
        searchKeys.some((k) => _.some(rule[k], (v) => fuzzyCaseInsensitive(ruleFilter, v))),
      );
    }
    const { t } = this.props;

    return (
      <div>
        <PaneBody>
          <SectionHeading text={t('public~Role details')} />
          <Grid hasGutter>
            <GridItem span={6}>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Role name')}</DescriptionListTerm>
                  <DescriptionListDescription>{name}</DescriptionListDescription>
                </DescriptionListGroup>
                {namespace && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('public~Namespace')}</DescriptionListTerm>
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
                  <DescriptionListTerm>{t('public~Created at')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Timestamp timestamp={creationTimestamp} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </GridItem>
          </Grid>
        </PaneBody>
        <PaneBody>
          <SectionHeading text={t('public~Rules')} />
          <div>
            {/* This page is temporarily disabled until we update the safe resources list.
            <div>
              <Link to={addHref(name, namespace)}>
                <Button variant="primary">{t('public~Add Rule')}</Button>
              </Link>
            </div>
            */}
            <TextFilter
              label={t('public~rules by action or resource')}
              onChange={this.changeFilter}
            />
          </div>
          <RulesList rules={rules} name={name} namespace={namespace} />
        </PaneBody>
      </div>
    );
  }
}
const DetailsWithTranslation = withTranslation()(Details);

const bindingsTableColumnInfo = [
  { id: 'name' },
  { id: 'subjectKind' },
  { id: 'subjectName' },
  { id: 'namespace-always-show' },
];

const getBindingsDataViewRows = (data, columns) => {
  return data.map(({ obj: binding }) => {
    const rowCells = {
      [bindingsTableColumnInfo[0].id]: {
        cell: <BindingName binding={binding} />,
        props: getNameCellProps(binding.metadata.name),
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
};

const useBindingsColumns = () => {
  const { t } = useTranslation();
  return React.useMemo(
    () => [
      {
        title: t('public~Name'),
        id: bindingsTableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Subject kind'),
        id: bindingsTableColumnInfo[1].id,
        sort: 'subject.kind',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Subject name'),
        id: bindingsTableColumnInfo[2].id,
        sort: 'subject.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
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

const BindingsListComponent = (props) => {
  const { t } = useTranslation();
  const columns = useBindingsColumns();

  const { data, loaded, staticFilters } = props;

  // Apply staticFilters to filter the data using table filters
  const filteredData = React.useMemo(() => {
    if (!staticFilters || !data) {
      return data;
    }

    const filtersMap = tableFilters(false); // false for fuzzy search

    return data.filter((binding) => {
      return staticFilters.every((filter) => {
        const filterKey = Object.keys(filter)[0];
        const filterValue = filter[filterKey];

        // Use the table filter function if it exists
        if (filtersMap[filterKey]) {
          return filtersMap[filterKey](filterValue, binding);
        }
      });
    });
  }, [data, staticFilters]);

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        data={filteredData}
        loaded={loaded}
        label={t('public~RoleBindings')}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getBindingsDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const BindingsForRolePage = (props) => {
  const { name, ns } = useParams();
  const {
    obj: { kind },
  } = props;
  const resources = [{ kind: 'RoleBinding', namespaced: true }];
  if (!ns) {
    resources.push({ kind: 'ClusterRoleBinding', namespaced: false, optional: true });
  }

  const { t } = useTranslation();
  return (
    <MultiListPage
      canCreate={true}
      createButtonText={t('public~Create binding')}
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
      omitFilterToolbar={true}
    />
  );
};

const getBreadcrumbs = (model, kindObj, location) => {
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

export const RolesDetailsPage = (props) => {
  const location = useLocation();
  return (
    <DetailsPage
      {...props}
      pages={[
        navFactory.details(DetailsWithTranslation),
        navFactory.editYaml(),
        {
          href: 'bindings',
          // t('public~RoleBindings')
          nameKey: 'public~RoleBindings',
          component: BindingsForRolePage,
        },
      ]}
      menuActions={menuActions}
      breadcrumbsFor={() => getBreadcrumbs(RoleModel, props.kindObj, location)}
    />
  );
};

export const ClusterRolesDetailsPage = RolesDetailsPage;

export const ClusterRoleBindingsDetailsPage = (props) => {
  const pages = [navFactory.details(DetailsForKind), navFactory.editYaml()];
  const actions = [...common];
  const location = useLocation();

  return (
    <DetailsPage
      {...props}
      menuActions={actions}
      pages={pages}
      breadcrumbsFor={() => getBreadcrumbs(RoleBindingModel, props.kindObj, location)}
    />
  );
};

const useRolesColumns = () => {
  const { t } = useTranslation();
  return [
    {
      title: t('public~Name'),
      id: tableColumnInfo[0].id,
      sort: 'metadata.name',
      props: {
        ...cellIsStickyProps,
        modifier: 'nowrap',
      },
    },
    {
      title: t('public~Namespace'),
      id: tableColumnInfo[1].id,
      sort: 'metadata.namespace',
      props: {
        modifier: 'nowrap',
      },
    },
    {
      title: '',
      id: tableColumnInfo[2].id,
      props: {
        ...cellIsStickyProps,
      },
    },
  ];
};

export const roleType = (role) => {
  if (!role) {
    return undefined;
  }
  if (isSystemRole(role)) {
    return 'system';
  }
  return role.metadata.namespace ? 'namespace' : 'cluster';
};

const useRoleFilterOptions = () => {
  const { t } = useTranslation();
  return React.useMemo(() => {
    return [
      {
        value: 'cluster',
        label: t('public~Cluster-wide Roles'),
      },
      {
        value: 'namespace',
        label: t('public~Namespace Roles'),
      },
      {
        value: 'system',
        label: t('public~System Roles'),
      },
    ];
  }, [t]);
};

const RolesList = (props) => {
  const { t } = useTranslation();
  const { data } = props;
  const columns = useRolesColumns();
  const roleFilterOptions = useRoleFilterOptions();

  const additionalFilterNodes = React.useMemo(
    () => [
      <DataViewCheckboxFilter
        key="role-kind"
        filterId="role-kind"
        title={t('public~Role')}
        placeholder={t('public~Filter by role')}
        options={roleFilterOptions}
      />,
    ],
    [roleFilterOptions, t],
  );

  const matchesAdditionalFilters = React.useCallback(
    (resource, filters) =>
      filters['role-kind'].length === 0 || filters['role-kind'].includes(roleType(resource)),
    [],
  );

  return (
    <React.Suspense fallback={<LoadingBox />}>
      {data.length === 0 ? (
        <ConsoleEmptyState title={t('public~No Roles found')}>
          {t(
            'public~Roles grant access to types of objects in the cluster. Roles are applied to a team or user via a RoleBinding.',
          )}
        </ConsoleEmptyState>
      ) : (
        <ConsoleDataView
          {...props}
          data={data}
          label={t('public~Roles')}
          columns={columns}
          getDataViewRows={getDataViewRows}
          initialFilters={{ ...initialFiltersDefault, 'role-kind': [] }}
          additionalFilterNodes={additionalFilterNodes}
          matchesAdditionalFilters={matchesAdditionalFilters}
          hideColumnManagement={true}
        />
      )}
    </React.Suspense>
  );
};

export const RolesPage = ({ namespace, mock, showTitle }) => {
  const createNS = namespace || 'default';
  const accessReview = {
    model: RoleModel,
    namespace: createNS,
  };
  const { t } = useTranslation();
  return (
    <MultiListPage
      ListComponent={RolesList}
      canCreate={true}
      showTitle={showTitle}
      namespace={namespace}
      createAccessReview={accessReview}
      createButtonText={t('public~Create Role')}
      createProps={{ to: `/k8s/ns/${createNS}/roles/~new` }}
      flatten={(resources) => _.flatMap(resources, 'data').filter((r) => !!r)}
      resources={[
        { kind: 'Role', namespaced: true, optional: mock },
        { kind: 'ClusterRole', namespaced: false, optional: true },
      ]}
      title={t('public~Roles')}
      mock={mock}
      omitFilterToolbar={true}
    />
  );
};
