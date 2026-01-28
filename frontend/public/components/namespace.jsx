/* eslint-disable tsdoc/syntax */
import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import * as _ from 'lodash';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { css } from '@patternfly/react-styles';
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';

import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { Link } from 'react-router-dom';

import { Status } from '@console/shared/src/components/status/Status';
import { getRequester, getDescription } from '@console/shared/src/selectors/namespace';
import {
  FLAGS,
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
  REQUESTER_FILTER,
} from '@console/shared/src/constants/common';
import { GreenCheckCircleIcon } from '@console/shared/src/components/status/icons';
import { getName } from '@console/shared/src/selectors/common';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { isModifiedEvent } from '@console/shared/src/utils/utils';
import { useFlag } from '@console/shared/src/hooks/flag';
import { usePrometheusGate } from '@console/shared/src/hooks/usePrometheusGate';
import { DASH } from '@console/shared/src/constants/ui';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import * as k8sActions from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  ConsoleLinkModel,
  NamespaceModel,
  ProjectModel,
  SecretModel,
  ServiceAccountModel,
} from '../models';
import { coFetchJSON } from '../co-fetch';
import { k8sGet, referenceForModel } from '../module/k8s';
import * as UIActions from '../actions/ui';
import { DetailsPage, ListPage, sorts } from './factory';
import { sortResourceByValue } from './factory/Table/sort';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { DetailsItem } from './utils/details-item';
import { LabelList } from './utils/label-list';
import { LoadingInline, LoadingBox } from './utils/status-box';
import { ResourceIcon } from './utils/resource-icon';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import {
  formatBytesAsMiB,
  formatCores,
  humanizeBinaryBytes,
  humanizeCpuCores,
} from './utils/units';
import { navFactory } from './utils/horizontal-nav';
import { useAccessReview } from './utils/rbac';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { LazyConfigureNamespacePullSecretModalOverlay } from './modals';
import { RoleBindingsPage } from './RBAC';
import { Bar } from './graphs/bar';
import { Area } from './graphs/area';
import { PROMETHEUS_BASE_PATH } from './graphs/consts';
import { flagPending } from '../reducers/features';
import { OpenShiftGettingStarted } from './start-guide';
import { OverviewListPage } from './overview';
import {
  getNamespaceDashboardConsoleLinks,
  ProjectDashboard,
} from './dashboard/project-dashboard/project-dashboard';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import {
  isCurrentUser,
  isOtherUser,
  isSystemNamespace,
} from '@console/shared/src/components/namespace';
import { useCreateNamespaceModal } from '@console/shared/src/hooks/useCreateNamespaceModal';
import { useCreateProjectModal } from '@console/shared/src/hooks/useCreateProjectModal';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';

const getDisplayName = (obj) =>
  _.get(obj, ['metadata', 'annotations', 'openshift.io/display-name']);

// KKD CHECK TO SEE THAT ITEMS CHANGE WHEN LANGUAGE CHANGES
const getFilters = () => [
  {
    filterGroupName: i18next.t('public~Requester'),
    type: 'requester',
    reducer: (namespace) => {
      const name = namespace.metadata?.name;
      const requester = namespace.metadata?.annotations?.['openshift.io/requester'];
      if (isCurrentUser(requester)) {
        return REQUESTER_FILTER.ME;
      }
      if (isOtherUser(requester, name)) {
        return REQUESTER_FILTER.USER;
      }
      if (isSystemNamespace({ title: name })) {
        return REQUESTER_FILTER.SYSTEM;
      }
    },
    items: [
      { id: REQUESTER_FILTER.ME, title: i18next.t('public~Me') },
      { id: REQUESTER_FILTER.USER, title: i18next.t('public~User') },
      { id: REQUESTER_FILTER.SYSTEM, title: i18next.t('public~System'), hideIfEmpty: true },
    ],
  },
];

const fetchNamespaceMetrics = () => {
  const metrics = [
    {
      key: 'memory',
      query: 'sum by(namespace) (container_memory_working_set_bytes{container="",pod!=""})',
    },
    {
      key: 'cpu',
      query: 'namespace:container_cpu_usage:sum',
    },
  ];
  const promises = metrics.map(({ key, query }) => {
    const url = `${PROMETHEUS_BASE_PATH}/api/v1/query?&query=${query}`;
    return coFetchJSON(url).then(({ data: { result } }) => {
      return result.reduce((acc, data) => {
        const value = Number(data.value[1]);
        return _.set(acc, [key, data.metric.namespace], value);
      }, {});
    });
  });
  return (
    Promise.all(promises)
      .then((data) => _.assign({}, ...data))
      // eslint-disable-next-line no-console
      .catch(console.error)
  );
};

const namespaceColumnInfo = [
  { id: 'name' },
  { id: 'displayName' },
  { id: 'status' },
  { id: 'requester' },
  { id: 'memory' },
  { id: 'cpu' },
  { id: 'created' },
  { id: 'description' },
  { id: 'labels' },
  { id: '' },
];

const useNamespacesColumns = () => {
  const { t } = useTranslation();
  return useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: namespaceColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Display name'),
        id: namespaceColumnInfo[1].id,
        sort: 'metadata.annotations["openshift.io/display-name"]',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Status'),
        id: namespaceColumnInfo[2].id,
        sort: 'status.phase',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Requester'),
        id: namespaceColumnInfo[3].id,
        sort: "metadata.annotations.['openshift.io/requester']",
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Memory'),
        id: namespaceColumnInfo[4].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, sorts.namespaceMemory)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~CPU'),
        id: namespaceColumnInfo[5].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, sorts.namespaceCPU)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Created'),
        id: namespaceColumnInfo[6].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Description'),
        id: namespaceColumnInfo[7].id,
        sort: "metadata.annotations.['openshift.io/description']",
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: t('public~Labels'),
        id: namespaceColumnInfo[8].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
          width: 10,
        },
        additional: true,
      },
      {
        title: '',
        id: namespaceColumnInfo[9].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
};

const NamespacesColumnManagementID = referenceForModel(NamespaceModel);

const getNamespaceDataViewRows = (rowData, tableColumns, namespaceMetrics, t) => {
  return rowData.map(({ obj: ns }) => {
    const name = getName(ns);
    const requester = getRequester(ns);
    const bytes = namespaceMetrics?.memory?.[name];
    const cores = namespaceMetrics?.cpu?.[name];
    const description = getDescription(ns);
    const labels = ns.metadata.labels;

    const rowCells = {
      [namespaceColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={name}
            namespace={ns.metadata.namespace}
          />
        ),
        props: getNameCellProps(name),
      },
      [namespaceColumnInfo[1].id]: {
        cell: (
          <>
            {getDisplayName(ns) || (
              <span className="pf-v6-u-text-color-subtle">{t('public~No display name')}</span>
            )}
          </>
        ),
      },
      [namespaceColumnInfo[2].id]: {
        cell: <Status status={ns.status?.phase} />,
      },
      [namespaceColumnInfo[3].id]: {
        cell: requester || (
          <span className="pf-v6-u-text-color-subtle">{t('public~No requester')}</span>
        ),
      },
      [namespaceColumnInfo[4].id]: {
        cell: bytes ? `${formatBytesAsMiB(bytes)} MiB` : DASH,
      },
      [namespaceColumnInfo[5].id]: {
        cell: cores ? t('public~{{cores}} cores', { cores: formatCores(cores) }) : DASH,
      },
      [namespaceColumnInfo[6].id]: {
        cell: <Timestamp timestamp={ns.metadata.creationTimestamp} />,
      },
      [namespaceColumnInfo[7].id]: {
        cell: (
          <>
            {description || (
              <span className="pf-v6-u-text-color-subtle">{t('public~No description')}</span>
            )}
          </>
        ),
      },
      [namespaceColumnInfo[8].id]: {
        cell: <LabelList kind="Namespace" labels={labels} />,
      },
      [namespaceColumnInfo[9].id]: {
        cell: <LazyActionMenu context={{ [referenceForModel(NamespaceModel)]: ns }} />,
        props: actionsCellProps,
      },
    };

    return tableColumns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

export const NamespacesList = (props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const columns = useNamespacesColumns();
  const [selectedColumns, , userSettingsLoaded] = useUserSettingsCompatibility(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    undefined,
    true,
  );
  const namespaceMetrics = useSelector(({ UI }) => UI.getIn(['metrics', 'namespace']));

  // TODO Utilize usePoll hook
  useEffect(() => {
    const updateMetrics = () =>
      fetchNamespaceMetrics().then((result) => dispatch(UIActions.setNamespaceMetrics(result)));
    updateMetrics();
    const id = setInterval(updateMetrics, 30 * 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  const columnLayout = useMemo(
    () => ({
      id: NamespacesColumnManagementID,
      type: t('public~Namespace'),
      columns: columns.map((col) => ({
        id: col.id,
        title: col.title,
        additional: col.additional,
      })),
      selectedColumns:
        selectedColumns?.[NamespacesColumnManagementID]?.length > 0
          ? new Set(selectedColumns[NamespacesColumnManagementID])
          : new Set(),
    }),
    [columns, selectedColumns, t],
  );

  const requesterFilterOptions = useMemo(
    () => [
      { value: REQUESTER_FILTER.ME, label: t('public~Me') },
      { value: REQUESTER_FILTER.USER, label: t('public~User') },
      { value: REQUESTER_FILTER.SYSTEM, label: t('public~System') },
    ],
    [t],
  );

  const initialFilters = useMemo(() => ({ ...initialFiltersDefault, requester: [] }), []);

  const additionalFilterNodes = useMemo(
    () => [
      <DataViewCheckboxFilter
        key="requester"
        filterId="requester"
        title={t('public~Requester')}
        placeholder={t('public~Filter by requester')}
        options={requesterFilterOptions}
      />,
    ],
    [t, requesterFilterOptions],
  );

  const matchesAdditionalFilters = useCallback((resource, filters) => {
    if (filters.requester?.length === 0) {
      return true;
    }
    const name = resource.metadata?.name;
    const requester = resource.metadata?.annotations?.['openshift.io/requester'];
    let requesterType;
    if (isCurrentUser(requester)) {
      requesterType = REQUESTER_FILTER.ME;
    } else if (isOtherUser(requester, name)) {
      requesterType = REQUESTER_FILTER.USER;
    } else if (isSystemNamespace({ title: name })) {
      requesterType = REQUESTER_FILTER.SYSTEM;
    }
    return !filters.requester || filters.requester.includes(String(requesterType));
  }, []);

  if (!userSettingsLoaded) {
    return null;
  }

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        label={NamespaceModel.labelPlural}
        columns={columns}
        columnLayout={columnLayout}
        columnManagementID={NamespacesColumnManagementID}
        initialFilters={initialFilters}
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
        getDataViewRows={(rowData, tableColumns) =>
          getNamespaceDataViewRows(rowData, tableColumns, namespaceMetrics, t)
        }
      />
    </Suspense>
  );
};

export const NamespacesPage = (props) => {
  const createNamespaceModal = useCreateNamespaceModal();

  return (
    <ListPage
      {...props}
      ListComponent={NamespacesList}
      canCreate={true}
      createHandler={() => createNamespaceModal()}
      omitFilterToolbar={true}
    />
  );
};

const projectColumnManagementID = referenceForModel(ProjectModel);

// Use same column info as namespaces since projects are namespaces
const projectColumnInfo = namespaceColumnInfo;

const useProjectsColumns = ({ showMetrics, showActions }) => {
  const { t } = useTranslation();
  return useMemo(() => {
    const columns = [
      {
        title: t('public~Name'),
        id: projectColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Display name'),
        id: projectColumnInfo[1].id,
        sort: 'metadata.annotations["openshift.io/display-name"]',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Status'),
        id: projectColumnInfo[2].id,
        sort: 'status.phase',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Requester'),
        id: projectColumnInfo[3].id,
        sort: "metadata.annotations.['openshift.io/requester']",
        props: {
          modifier: 'nowrap',
        },
      },
    ];

    if (showMetrics) {
      columns.push(
        {
          title: t('public~Memory'),
          id: projectColumnInfo[4].id,
          sort: (data, direction) =>
            data.sort(sortResourceByValue(direction, sorts.namespaceMemory)),
          props: {
            modifier: 'nowrap',
          },
        },
        {
          title: t('public~CPU'),
          id: projectColumnInfo[5].id,
          sort: (data, direction) => data.sort(sortResourceByValue(direction, sorts.namespaceCPU)),
          props: {
            modifier: 'nowrap',
          },
        },
      );
    }

    columns.push(
      {
        title: t('public~Created'),
        id: projectColumnInfo[6].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Description'),
        id: projectColumnInfo[7].id,
        sort: "metadata.annotations.['openshift.io/description']",
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: t('public~Labels'),
        id: projectColumnInfo[8].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
          width: 10,
        },
        additional: true,
      },
    );

    if (showActions) {
      columns.push({
        title: '',
        id: projectColumnInfo[9].id,
        props: {
          ...cellIsStickyProps,
        },
      });
    }

    return columns;
  }, [t, showMetrics, showActions]);
};

const getProjectDataViewRows = (
  rowData,
  tableColumns,
  namespaceMetrics,
  showMetrics,
  ProjectLinkComponent,
  t,
) => {
  return rowData.map(({ obj: project }) => {
    const name = getName(project);
    const requester = getRequester(project);
    const bytes = namespaceMetrics?.memory?.[name];
    const cores = namespaceMetrics?.cpu?.[name];
    const description = getDescription(project);
    const labels = project.metadata.labels;

    const rowCells = {
      [projectColumnInfo[0].id]: {
        cell: ProjectLinkComponent ? (
          <ProjectLinkComponent project={project} />
        ) : (
          <span className="co-resource-item">
            <ResourceLink kind="Project" name={project.metadata.name} />
          </span>
        ),
        props: getNameCellProps(name),
      },
      [projectColumnInfo[1].id]: {
        cell: (
          <span className="co-break-word co-line-clamp">
            {getDisplayName(project) || (
              <span className="pf-v6-u-text-color-subtle">{t('public~No display name')}</span>
            )}
          </span>
        ),
      },
      [projectColumnInfo[2].id]: {
        cell: <Status status={project.status?.phase} />,
      },
      [projectColumnInfo[3].id]: {
        cell: requester || (
          <span className="pf-v6-u-text-color-subtle">{t('public~No requester')}</span>
        ),
      },
      [projectColumnInfo[4].id]: {
        cell: showMetrics ? (bytes ? `${formatBytesAsMiB(bytes)} MiB` : DASH) : null,
      },
      [projectColumnInfo[5].id]: {
        cell: showMetrics
          ? cores
            ? t('public~{{cores}} cores', { cores: formatCores(cores) })
            : DASH
          : null,
      },
      [projectColumnInfo[6].id]: {
        cell: <Timestamp timestamp={project.metadata.creationTimestamp} />,
      },
      [projectColumnInfo[7].id]: {
        cell: (
          <span className="co-break-word co-line-clamp">
            {description || (
              <span className="pf-v6-u-text-color-subtle">{t('public~No description')}</span>
            )}
          </span>
        ),
      },
      [projectColumnInfo[8].id]: {
        cell: <LabelList labels={labels} kind="Project" />,
      },
      [projectColumnInfo[9].id]: {
        cell: <LazyActionMenu context={{ [referenceForModel(ProjectModel)]: project }} />,
        props: actionsCellProps,
      },
    };

    return tableColumns.map(({ id }) => {
      const cell = rowCells[id]?.cell !== undefined ? rowCells[id]?.cell : DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const ProjectLink = ({ project }) => {
  const dispatch = useDispatch();
  const [, setLastNamespace] = useUserSettingsCompatibility(
    LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
    LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  );
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const basePath = url.pathname;
  if (params.has('project-name')) {
    // clear project-name query param from the url
    params.delete('project-name');
  }
  const newUrl = {
    search: `?${params.toString()}`,
    hash: url.hash,
  };
  const namespacedPath = UIActions.formatNamespaceRoute(project.metadata.name, basePath, newUrl);

  const handleClick = (e) => {
    // Don't set last namespace if its modified click (Ctrl+Click).
    if (isModifiedEvent(e)) {
      return;
    }
    setLastNamespace(project.metadata.name);
    // update last namespace in session storage (persisted only for current browser tab). Used to remember/restore if
    // "All Projects" was selected when returning to the list view (typically from details view) via breadcrumb or
    // sidebar navigation
    sessionStorage.setItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY, project.metadata.name);
    // clear project-name filter when active namespace is changed
    dispatch(k8sActions.filterList(referenceForModel(ProjectModel), 'project-name', ''));
  };

  return (
    <span className="co-resource-item co-resource-item--truncate">
      <ResourceIcon kind="Project" />
      <Link to={namespacedPath} className="co-resource-item__resource-name" onClick={handleClick}>
        {project.metadata.name}
      </Link>
    </span>
  );
};

export const ProjectsTable = (props) => {
  const { t } = useTranslation();
  const columns = useProjectsColumns({ showMetrics: false, showActions: false });

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        label={ProjectModel.labelPlural}
        columns={columns}
        getDataViewRows={(rowData, tableColumns) =>
          getProjectDataViewRows(rowData, tableColumns, null, false, ProjectLink, t)
        }
        hideColumnManagement
      />
    </Suspense>
  );
};

export const ProjectList = (props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const canGetNS = useFlag(FLAGS.CAN_GET_NS);
  const [selectedColumns, , userSettingsLoaded] = useUserSettingsCompatibility(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    undefined,
    true,
  );
  const isPrometheusAvailable = usePrometheusGate();
  const showMetrics = isPrometheusAvailable && canGetNS;
  const showActions = true;
  const columns = useProjectsColumns({ showMetrics, showActions });
  const namespaceMetrics = useSelector(({ UI }) => UI.getIn(['metrics', 'namespace']));

  // TODO Utilize usePoll hook
  useEffect(() => {
    if (showMetrics) {
      const updateMetrics = () =>
        fetchNamespaceMetrics().then((result) => dispatch(UIActions.setNamespaceMetrics(result)));
      updateMetrics();
      const id = setInterval(updateMetrics, 30 * 1000);
      return () => clearInterval(id);
    }
  }, [dispatch, showMetrics]);

  const columnLayout = useMemo(
    () => ({
      id: projectColumnManagementID,
      type: t('public~Project'),
      columns: columns.map((col) => ({
        id: col.id,
        title: col.title,
        additional: col.additional,
      })),
      selectedColumns:
        selectedColumns?.[projectColumnManagementID]?.length > 0
          ? new Set(selectedColumns[projectColumnManagementID])
          : new Set(),
    }),
    [columns, selectedColumns, t],
  );

  const requesterFilterOptions = useMemo(
    () => [
      { value: REQUESTER_FILTER.ME, label: t('public~Me') },
      { value: REQUESTER_FILTER.USER, label: t('public~User') },
      { value: REQUESTER_FILTER.SYSTEM, label: t('public~System') },
    ],
    [t],
  );

  const initialFilters = useMemo(() => ({ ...initialFiltersDefault, requester: [] }), []);

  const additionalFilterNodes = useMemo(
    () => [
      <DataViewCheckboxFilter
        key="requester"
        filterId="requester"
        title={t('public~Requester')}
        placeholder={t('public~Filter by requester')}
        options={requesterFilterOptions}
      />,
    ],
    [t, requesterFilterOptions],
  );

  const matchesAdditionalFilters = useCallback((resource, filters) => {
    if (filters.requester?.length === 0) {
      return true;
    }
    const name = resource.metadata?.name;
    const requester = resource.metadata?.annotations?.['openshift.io/requester'];
    let requesterType;
    if (isCurrentUser(requester)) {
      requesterType = REQUESTER_FILTER.ME;
    } else if (isOtherUser(requester, name)) {
      requesterType = REQUESTER_FILTER.USER;
    } else if (isSystemNamespace({ title: name })) {
      requesterType = REQUESTER_FILTER.SYSTEM;
    }
    return !filters.requester || filters.requester.includes(String(requesterType));
  }, []);

  // Don't render the table until we know whether we can get metrics. It's
  // not possible to change the table headers once the component is mounted.
  if (flagPending(canGetNS) || !userSettingsLoaded) {
    return null;
  }

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        label={ProjectModel.labelPlural}
        columns={columns}
        columnLayout={columnLayout}
        columnManagementID={projectColumnManagementID}
        initialFilters={initialFilters}
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
        getDataViewRows={(rowData, tableColumns) =>
          getProjectDataViewRows(rowData, tableColumns, namespaceMetrics, showMetrics, undefined, t)
        }
        NoDataEmptyMsg={OpenShiftGettingStarted}
      />
    </Suspense>
  );
};

export const ProjectsPage = (props) => {
  const { t } = useTranslation();
  const createProjectModal = useCreateProjectModal();
  // Skip self-subject access review for projects since they use a special project request API.
  // `FLAGS.CAN_CREATE_PROJECT` determines if the user can create projects.
  const canCreateProject = useFlag(FLAGS.CAN_CREATE_PROJECT);
  return (
    <ListPage
      {...props}
      rowFilters={getFilters()}
      ListComponent={ProjectList}
      canCreate={canCreateProject}
      createHandler={() => createProjectModal()}
      filterLabel={t('public~by name or display name')}
      skipAccessReview
      textFilter="project-name"
      kind="Project"
      omitFilterToolbar={true}
    />
  );
};

/** @type {FC<{namespace: K8sResourceKind}>} */
export const PullSecret = (props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const { t } = useTranslation();
  const { namespace, canViewSecrets } = props;
  const launchModal = useOverlay();

  useEffect(() => {
    k8sGet(ServiceAccountModel, 'default', namespace.metadata.name, {})
      .then((serviceAccount) => {
        setIsLoading(false);
        setData(serviceAccount.imagePullSecrets ?? []);
        setError(false);
      })
      .catch((err) => {
        setIsLoading(false);
        setData([]);
        setError(true);
        // eslint-disable-next-line no-console
        console.error('Error getting default ServiceAccount', err);
      });
  }, [namespace.metadata.name]);

  const modal = () =>
    launchModal(LazyConfigureNamespacePullSecretModalOverlay, {
      namespace,
      pullSecret: undefined,
    });

  const secrets = () => {
    if (error) {
      return <Alert variant="danger" isInline title={t('Error loading default pull Secrets')} />;
    }
    return data.length > 0 ? (
      data.map((secret) => (
        <div key={secret.name}>
          <ResourceLink
            kind="Secret"
            name={secret.name}
            namespace={namespace.metadata.name}
            linkTo={canViewSecrets}
          />
        </div>
      ))
    ) : (
      <Button
        icon={<PencilAltIcon />}
        iconPosition="end"
        variant="link"
        type="button"
        isInline
        onClick={modal}
      >
        {t('public~Not configured')}
      </Button>
    );
  };

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>
        {t('public~Default pull Secret', { count: data.length })}
      </DescriptionListTerm>
      <DescriptionListDescription>
        {isLoading ? <LoadingInline /> : secrets()}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export const NamespaceLineCharts = ({ ns }) => {
  const { t } = useTranslation();
  return (
    <Grid hasGutter>
      <GridItem md={6}>
        <Area
          title={t('public~CPU usage')}
          humanize={humanizeCpuCores}
          namespace={ns.metadata.name}
          query={`namespace:container_cpu_usage:sum{namespace='${ns.metadata.name}'}`}
        />
      </GridItem>
      <GridItem md={6}>
        <Area
          title={t('public~Memory usage')}
          humanize={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          namespace={ns.metadata.name}
          query={`sum by(namespace) (container_memory_working_set_bytes{namespace="${ns.metadata.name}",container="",pod!=""})`}
        />
      </GridItem>
    </Grid>
  );
};

export const TopPodsBarChart = ({ ns }) => {
  const { t } = useTranslation();
  return (
    <Bar
      title={t('public~Memory usage by pod (top 10)')}
      namespace={ns.metadata.name}
      query={`sort_desc(topk(10, sum by (pod)(container_memory_working_set_bytes{container="",pod!="",namespace="${ns.metadata.name}"})))`}
      humanize={humanizeBinaryBytes}
      metric="pod"
    />
  );
};

const ResourceUsage = ({ ns }) => {
  const { t } = useTranslation();
  const isPrometheusAvailable = usePrometheusGate();
  return isPrometheusAvailable ? (
    <PaneBody>
      <SectionHeading text={t('public~Resource usage')} />
      <NamespaceLineCharts ns={ns} />
      <TopPodsBarChart ns={ns} />
    </PaneBody>
  ) : null;
};

export const NamespaceSummary = ({ ns }) => {
  const { t } = useTranslation();
  const displayName = getDisplayName(ns);
  const description = getDescription(ns);
  const requester = getRequester(ns);
  const serviceMeshEnabled = ns.metadata?.labels?.['maistra.io/member-of'];
  const canListSecrets = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    verb: 'patch',
    namespace: ns.metadata.name,
  });

  return (
    <Grid hasGutter>
      <GridItem sm={6}>
        {/* Labels aren't editable on kind Project, only Namespace. */}
        <ResourceSummary resource={ns} showLabelEditor={ns.kind === 'Namespace'}>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Display name')}</DescriptionListTerm>
            <DescriptionListDescription
              className={css({
                'text-muted': !displayName,
              })}
            >
              {displayName || t('public~No display name')}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Description')}</DescriptionListTerm>
            <DescriptionListDescription>
              <p
                className={css({
                  'pf-v6-u-text-color-subtle': !description,
                  'co-pre-wrap': description,
                  'co-namespace-summary__description': description,
                })}
              >
                {description || t('public~No description')}
              </p>
            </DescriptionListDescription>
          </DescriptionListGroup>
          {requester && (
            <DescriptionListGroup>
              <DescriptionListTerm>Requester</DescriptionListTerm>{' '}
              <DescriptionListDescription>{requester}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </ResourceSummary>
      </GridItem>
      <GridItem sm={6}>
        <DescriptionList>
          <DetailsItem label={t('public~Status')} obj={ns} path="status.phase">
            <Status status={ns.status?.phase} />
          </DetailsItem>
          <PullSecret namespace={ns} canViewSecrets={canListSecrets} />
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~NetworkPolicies')}</DescriptionListTerm>
            <DescriptionListDescription>
              <Link to={`/k8s/ns/${ns.metadata.name}/networkpolicies`}>
                {t('public~NetworkPolicies')}
              </Link>
            </DescriptionListDescription>
          </DescriptionListGroup>
          {serviceMeshEnabled && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Service mesh')}</DescriptionListTerm>
              <DescriptionListDescription>
                <GreenCheckCircleIcon /> {t('public~Service mesh enabled')}
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </GridItem>
    </Grid>
  );
};

export const NamespaceDetails = ({ obj: ns, customData }) => {
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const [consoleLinks] = useK8sWatchResource({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const links = getNamespaceDashboardConsoleLinks(ns, consoleLinks);
  return (
    <div>
      {perspective === 'dev' && <DocumentTitle>{t('public~Project details')}</DocumentTitle>}
      <PaneBody>
        {!customData?.hideHeading && (
          <SectionHeading text={t('public~{{kind}} details', { kind: ns.kind })} />
        )}
        <NamespaceSummary ns={ns} />
      </PaneBody>
      {ns.kind === 'Namespace' && <ResourceUsage ns={ns} />}
      {!_.isEmpty(links) && (
        <PaneBody>
          <SectionHeading text={t('public~Launcher')} />
          <ul className="pf-v6-c-list pf-m-plain">
            {_.map(_.sortBy(links, 'spec.text'), (link) => {
              return (
                <li key={link.metadata.uid}>
                  <ExternalLink href={link.spec.href} text={link.spec.text} />
                </li>
              );
            })}
          </ul>
        </PaneBody>
      )}
    </div>
  );
};

const RolesPage = ({ obj: { metadata } }) => {
  return (
    <RoleBindingsPage
      createPath={`/k8s/ns/${metadata.name}/rolebindings/~new`}
      namespace={metadata.name}
      showTitle={false}
    />
  );
};

export const NamespacesDetailsPage = (props) => (
  <DetailsPage
    {...props}
    kind={referenceForModel(NamespaceModel)}
    customActionMenu={(k8sObj, obj) => (
      <LazyActionMenu
        context={{ [referenceForModel(NamespaceModel)]: obj }}
        variant={ActionMenuVariant.DROPDOWN}
      />
    )}
    pages={[
      navFactory.details(NamespaceDetails),
      navFactory.editYaml(),
      navFactory.roles(RolesPage),
    ]}
  />
);

export const ProjectsDetailsPage = (props) => {
  return (
    <DetailsPage
      {...props}
      kind={referenceForModel(ProjectModel)}
      customActionMenu={(k8sObj, obj) => (
        <LazyActionMenu
          context={{ [referenceForModel(ProjectModel)]: obj }}
          variant={ActionMenuVariant.DROPDOWN}
        />
      )}
      pages={[
        {
          href: '',
          // t('public~Overview')
          nameKey: 'public~Overview',
          component: ProjectDashboard,
        },
        {
          href: 'details',
          // t('public~Details')
          nameKey: 'public~Details',
          component: NamespaceDetails,
        },
        navFactory.editYaml(),
        navFactory.workloads(OverviewListPage),
        navFactory.roles(RolesPage),
      ]}
    />
  );
};
