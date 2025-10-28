/* eslint-disable tsdoc/syntax */
import * as _ from 'lodash-es';
import React, { useEffect, useState, useMemo } from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Tooltip,
  Grid,
  GridItem,
} from '@patternfly/react-core';

import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { Link } from 'react-router-dom';

import {
  Status,
  getRequester,
  getDescription,
  FLAGS,
  GreenCheckCircleIcon,
  getName,
  REQUESTER_FILTER,
  useFlag,
  usePrometheusGate,
  DASH,
} from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
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
import { DetailsPage, ListPage } from './factory';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import {
  DetailsItem,
  Kebab,
  LabelList,
  LoadingInline,
  LoadingBox,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  formatBytesAsMiB,
  formatCores,
  humanizeBinaryBytes,
  humanizeCpuCores,
  navFactory,
  useAccessReview,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { deleteNamespaceModal, configureNamespacePullSecretModal } from './modals';
import { RoleBindingsPage } from './RBAC';
import { Bar, Area, PROMETHEUS_BASE_PATH } from './graphs';
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

export const deleteModal = (kind, ns) => {
  const { labelKey, labelKind, weight, accessReview } = Kebab.factory.Delete(kind, ns);
  let callback = undefined;
  let tooltip;
  let label;

  if (ns.metadata.name === 'default') {
    tooltip = `${kind.label} default cannot be deleted`;
  } else if (ns.status?.phase === 'Terminating') {
    tooltip = `${kind.label} is already terminating`;
  } else {
    callback = () => deleteNamespaceModal({ kind, resource: ns });
  }
  if (tooltip) {
    label = (
      <div className="dropdown__disabled">
        <Tooltip content={tooltip}>
          <span>{i18next.t(labelKey, labelKind)}</span>
        </Tooltip>
      </div>
    );
  }
  return { label, labelKey, labelKind, weight, callback, accessReview };
};

const nsMenuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  Kebab.factory.Edit,
  deleteModal,
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

const namespaceColumnInfo = Object.freeze({
  name: {
    classes: '',
    id: 'name',
  },
  displayName: {
    classes: 'co-break-word',
    id: 'displayName',
  },
  status: {
    classes: '',
    id: 'status',
  },
  requester: {
    classes: '',
    id: 'requester',
  },
  memory: {
    classes: '',
    id: 'memory',
  },
  cpu: {
    classes: '',
    id: 'cpu',
  },
  created: {
    classes: '',
    id: 'created',
  },
  description: {
    classes: '',
    id: 'description',
  },
  labels: {
    classes: '',
    id: 'labels',
  },
});

const NamespacesTableHeader = () => {
  return [
    {
      title: i18next.t('public~Name'),
      id: namespaceColumnInfo.name.id,
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.name.classes },
    },
    {
      title: i18next.t('public~Display name'),
      id: namespaceColumnInfo.displayName.id,
      sortField: 'metadata.annotations["openshift.io/display-name"]',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.displayName.classes },
    },
    {
      title: i18next.t('public~Status'),
      id: namespaceColumnInfo.status.id,
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.status.classes },
    },
    {
      title: i18next.t('public~Requester'),
      id: namespaceColumnInfo.requester.id,
      sortField: "metadata.annotations.['openshift.io/requester']",
      transforms: [sortable],
      props: { className: namespaceColumnInfo.requester.classes },
    },
    {
      title: i18next.t('public~Memory'),
      id: namespaceColumnInfo.memory.id,
      sortFunc: 'namespaceMemory',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.memory.classes },
    },
    {
      title: i18next.t('public~CPU'),
      id: namespaceColumnInfo.cpu.id,
      sortFunc: 'namespaceCPU',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.cpu.classes },
    },
    {
      title: i18next.t('public~Created'),
      id: namespaceColumnInfo.created.id,
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.created.classes },
    },
    {
      title: i18next.t('public~Description'),
      id: namespaceColumnInfo.description.id,
      sortField: "metadata.annotations.['openshift.io/description']",
      transforms: [sortable],
      props: { className: namespaceColumnInfo.description.classes },
      additional: true,
    },
    {
      title: i18next.t('public~Labels'),
      id: namespaceColumnInfo.labels.id,
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.labels.classes },
      additional: true,
    },
    { title: '', props: { className: Kebab.columnClass } },
  ];
};
NamespacesTableHeader.displayName = 'NamespacesTableHeader';
const NamespacesColumnManagementID = referenceForModel(NamespaceModel);
const useNamespacesColumns = () => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: namespaceColumnInfo.name.id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Display name'),
        id: namespaceColumnInfo.displayName.id,
        sort: 'metadata.annotations["openshift.io/display-name"]',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Status'),
        id: namespaceColumnInfo.status.id,
        sort: 'status.phase',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Requester'),
        id: namespaceColumnInfo.requester.id,
        sort: "metadata.annotations.['openshift.io/requester']",
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Memory'),
        id: namespaceColumnInfo.memory.id,
        sort: 'namespaceMemory',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~CPU'),
        id: namespaceColumnInfo.cpu.id,
        sort: 'namespaceCPU',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Created'),
        id: namespaceColumnInfo.created.id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Description'),
        id: namespaceColumnInfo.description.id,
        sort: "metadata.annotations.['openshift.io/description']",
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: t('public~Labels'),
        id: namespaceColumnInfo.labels.id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: '',
        id: '',
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const getNamespacesDataViewRows = (data, columns) => {
  return data.map(({ obj: ns }) => {
    const name = getName(ns);
    const requester = getRequester(ns);
    const description = getDescription(ns);
    const labels = ns.metadata.labels;
    const displayName = getDisplayName(ns);
    // Note: Metrics will be handled by the parent component's useSelector
    const bytes = ns._metrics?.memory;
    const cores = ns._metrics?.cpu;

    const rowCells = {
      [namespaceColumnInfo.name.id]: {
        cell: <ResourceLink kind="Namespace" name={ns.metadata.name} />,
        props: getNameCellProps(name),
      },
      [namespaceColumnInfo.displayName.id]: {
        cell: (
          <span className="co-break-word co-line-clamp">
            {displayName || <span className="pf-v6-u-text-color-subtle">No display name</span>}
          </span>
        ),
      },
      [namespaceColumnInfo.status.id]: {
        cell: <Status status={ns.status?.phase} />,
      },
      [namespaceColumnInfo.requester.id]: {
        cell: requester || <span className="pf-v6-u-text-color-subtle">No requester</span>,
      },
      [namespaceColumnInfo.memory.id]: {
        cell: bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-',
      },
      [namespaceColumnInfo.cpu.id]: {
        cell: cores ? `${formatCores(cores)} cores` : '-',
      },
      [namespaceColumnInfo.created.id]: {
        cell: <Timestamp timestamp={ns.metadata.creationTimestamp} />,
      },
      [namespaceColumnInfo.description.id]: {
        cell: (
          <span className="co-break-word co-line-clamp">
            {description || <span className="pf-v6-u-text-color-subtle">No description</span>}
          </span>
        ),
      },
      [namespaceColumnInfo.labels.id]: {
        cell: <LabelList kind="Namespace" labels={labels} />,
      },
      '': {
        cell: <ResourceKebab actions={nsMenuActions} kind="Namespace" resource={ns} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
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
  const dispatch = useDispatch();
  const columns = useNamespacesColumns();
  const metrics = useSelector(({ UI }) => UI.getIn(['metrics', 'namespace']));
  const { t } = useTranslation();

  // TODO Utilize usePoll hook
  useEffect(() => {
    const updateMetrics = () =>
      fetchNamespaceMetrics().then((result) => dispatch(UIActions.setNamespaceMetrics(result)));
    updateMetrics();
    const id = setInterval(updateMetrics, 30 * 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  // Enhance data with metrics
  const enhancedData = useMemo(() => {
    if (!props.data) {
      return [];
    }
    return props.data.map((item) => {
      const name = getName(item);
      const bytes = metrics?.memory?.[name];
      const cores = metrics?.cpu?.[name];
      return {
        ...item,
        obj: {
          ...item.obj,
          _metrics: { memory: bytes, cpu: cores },
        },
      };
    });
  }, [props.data, metrics]);

  const columnLayout = useMemo(
    () => ({
      columns: columns
        .filter((column) => column.title && column.title.trim() !== '')
        .map((column) => _.pick(column, ['title', 'additional', 'id'])),
      id: NamespacesColumnManagementID,
      selectedColumns: null,
      type: t('public~Namespace'),
      showNamespaceOverride: false,
    }),
    [columns, t],
  );

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        data={enhancedData}
        label={NamespaceModel.labelPlural}
        columns={columns}
        columnLayout={columnLayout}
        columnManagementID={NamespacesColumnManagementID}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getNamespacesDataViewRows}
      />
    </React.Suspense>
  );
};

export const NamespacesPage = (props) => {
  const createNamespaceModal = useCreateNamespaceModal();
  return (
    <ListPage
      {...props}
      rowFilters={getFilters()}
      ListComponent={NamespacesList}
      canCreate={true}
      createHandler={() => createNamespaceModal()}
      omitFilterToolbar={true}
    />
  );
};

export const projectMenuActions = [Kebab.factory.Edit, deleteModal];
const projectColumnInfo = [
  { id: 'name' },
  { id: 'displayName' },
  { id: 'status' },
  { id: 'requester' },
  { id: 'memory' },
  { id: 'cpu' },
  { id: 'created' },
  { id: 'description' },
  { id: 'labels' },
  { id: 'actions' },
];

const useProjectsColumns = () => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
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
      {
        title: t('public~Memory'),
        id: projectColumnInfo[4].id,
        sort: 'namespaceMemory',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~CPU'),
        id: projectColumnInfo[5].id,
        sort: 'namespaceCPU',
        props: {
          modifier: 'nowrap',
        },
      },
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
        },
        additional: true,
      },
      {
        title: '',
        id: 'actions',
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const getProjectsDataViewRows = (data, columns) => {
  return data.map(({ obj: project }) => {
    const name = getName(project);
    const requester = getRequester(project);
    const description = getDescription(project);
    const labels = project.metadata.labels;
    const displayName = getDisplayName(project);
    const bytes = project._metrics?.memory;
    const cores = project._metrics?.cpu;

    const rowCells = {
      [projectColumnInfo[0].id]: {
        cell: <ResourceLink kind="Project" name={project.metadata.name} />,
        props: getNameCellProps(name),
      },
      [projectColumnInfo[1].id]: {
        cell: (
          <span className="co-break-word co-line-clamp">
            {displayName || <span className="pf-v6-u-text-color-subtle">No display name</span>}
          </span>
        ),
      },
      [projectColumnInfo[2].id]: {
        cell: <Status status={project.status?.phase} />,
      },
      [projectColumnInfo[3].id]: {
        cell: requester || <span className="pf-v6-u-text-color-subtle">No requester</span>,
      },
      [projectColumnInfo[4].id]: {
        cell: bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-',
      },
      [projectColumnInfo[5].id]: {
        cell: cores ? `${formatCores(cores)} cores` : '-',
      },
      [projectColumnInfo[6].id]: {
        cell: <Timestamp timestamp={project.metadata.creationTimestamp} />,
      },
      [projectColumnInfo[7].id]: {
        cell: (
          <span className="co-break-word co-line-clamp">
            {description || <span className="pf-v6-u-text-color-subtle">No description</span>}
          </span>
        ),
      },
      [projectColumnInfo[8].id]: {
        cell: <LabelList kind="Project" labels={labels} />,
      },
      [projectColumnInfo[9].id]: {
        cell: <ResourceKebab actions={projectMenuActions} kind="Project" resource={project} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const projectColumnManagementID = referenceForModel(ProjectModel);

export const ProjectList = (props) => {
  const dispatch = useDispatch();
  const columns = useProjectsColumns();
  const metrics = useSelector(({ UI }) => UI.getIn(['metrics', 'namespace']));
  const { t } = useTranslation();

  // TODO Utilize usePoll hook
  useEffect(() => {
    const updateMetrics = () =>
      fetchNamespaceMetrics().then((result) => dispatch(UIActions.setNamespaceMetrics(result)));
    updateMetrics();
    const id = setInterval(updateMetrics, 30 * 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  const enhancedData = useMemo(() => {
    if (!props.data) {
      return [];
    }
    return props.data.map((item) => {
      const name = getName(item);
      const bytes = metrics?.memory?.[name];
      const cores = metrics?.cpu?.[name];
      return {
        ...item,
        obj: {
          ...item.obj,
          _metrics: { memory: bytes, cpu: cores },
        },
      };
    });
  }, [props.data, metrics]);

  const columnLayout = useMemo(
    () => ({
      columns: columns
        .filter((column) => column.title && column.title.trim() !== '')
        .map((column) => _.pick(column, ['title', 'additional', 'id'])),
      id: projectColumnManagementID,
      selectedColumns: null,
      type: t('public~Project'),
      showNamespaceOverride: false,
    }),
    [columns, t],
  );

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        data={enhancedData}
        label={ProjectModel.labelPlural}
        columns={columns}
        columnLayout={columnLayout}
        columnManagementID={projectColumnManagementID}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getProjectsDataViewRows}
      />
    </React.Suspense>
  );
};

export const ProjectsPage = (props) => {
  const { t } = useTranslation();
  const createProjectModal = useCreateProjectModal();
  // Skip self-subject access review for projects since they use a special project request API.
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

/** @type {React.FCC<{namespace: K8sResourceKind}>} */
export const PullSecret = (props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const { t } = useTranslation();
  const { namespace, canViewSecrets } = props;

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

  const modal = () => configureNamespacePullSecretModal({ namespace, pullSecret: undefined });

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
    menuActions={nsMenuActions}
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
      menuActions={projectMenuActions}
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
