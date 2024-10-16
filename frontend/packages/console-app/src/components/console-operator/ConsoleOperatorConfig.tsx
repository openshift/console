import * as React from 'react';
import { Alert, Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import {
  ISortBy,
  OnSort,
  SortByDirection,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { ThSortType } from '@patternfly/react-table/dist/esm/components/Table/base/types';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom-v5-compat';
import { useAccessReview, WatchK8sResource } from '@console/dynamic-plugin-sdk';
import {
  getGroupVersionKindForModel,
  getReferenceForModel,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { breadcrumbsForGlobalConfig } from '@console/internal/components/cluster-settings/global-config';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import {
  asAccessReview,
  EmptyBox,
  KebabAction,
  LoadingBox,
  navFactory,
  RequireCreatePermission,
  ResourceLink,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleOperatorConfigModel, ConsolePluginModel } from '@console/internal/models';
import {
  ConsolePluginKind,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceForModel,
} from '@console/internal/module/k8s';
import {
  isLoadedDynamicPluginInfo,
  isNotLoadedDynamicPluginInfo,
  LoadedDynamicPluginInfo,
  NotLoadedDynamicPluginInfo,
} from '@console/plugin-sdk/src';
import { useDynamicPluginInfo } from '@console/plugin-sdk/src/api/useDynamicPluginInfo';
import { consolePluginModal, CONSOLE_OPERATOR_CONFIG_NAME, DASH, Status } from '@console/shared';
import {
  boolComparator,
  looseSemVerComparator,
  rBoolComparator,
  rLooseSemVerComparator,
  rStringComparator,
  stringComparator,
} from '@console/shared/src/utils/comparators';

const developmentMode = window.SERVER_FLAGS.k8sMode === 'off-cluster';
const consolePluginGVK = getGroupVersionKindForModel(ConsolePluginModel);
const consolePluginConcatenatedGVK = getReferenceForModel(ConsolePluginModel);
const consoleOperatorConfigReference: K8sResourceKindReference = referenceForModel(
  ConsoleOperatorConfigModel,
);

const pluginRowComparators = [
  // name
  {
    asc: (a, b) => stringComparator(a.name, b.name),
    desc: (a, b) => rStringComparator(a.name, b.name),
  },
  // version
  {
    asc: (a, b) => looseSemVerComparator(a.version, b.version),
    desc: (a, b) => rLooseSemVerComparator(a.version, b.version),
  },
  // description
  {
    asc: (a, b) => stringComparator(a.description, b.description),
    desc: (a, b) => rStringComparator(a.description, b.description),
  },
  // status
  {
    asc: (a, b) => stringComparator(a.status?.phase, b.status?.phase),
    desc: (a, b) => rStringComparator(a.status?.phase, b.status?.phase),
  },
  // enabled
  {
    asc: (a, b) => boolComparator(a.enabled, b.enabled),
    desc: (a, b) => rBoolComparator(a.enabled, b.enabled),
  },
];

const useConsolePluginsDevListRows = (): [ConsolePluginRow[], boolean] => {
  const [pluginInfo, pluginInfoLoaded] = useDynamicPluginInfo();
  const rows = React.useMemo(
    () =>
      !pluginInfoLoaded
        ? []
        : pluginInfo.filter(isLoadedDynamicPluginInfo).map((plugin) => ({
            name: plugin.metadata.name,
            version: plugin.metadata.version,
            description: plugin.metadata?.customProperties?.console?.description || DASH,
            enabled: plugin.enabled,
            status: {
              state: plugin.status,
            },
          })),
    [pluginInfo, pluginInfoLoaded],
  );
  return [rows, pluginInfoLoaded];
};

const useConsolePluginListRows = (enabledPlugins: string[]): [ConsolePluginRow[], boolean] => {
  const [pluginInfo, pluginInfoLoaded] = useDynamicPluginInfo();
  const [consolePlugins, consolePluginsLoaded] = useK8sWatchResource<ConsolePluginKind[]>({
    isList: true,
    kind: referenceForModel(ConsolePluginModel),
  });
  const rows = React.useMemo(() => {
    if (!pluginInfoLoaded || !consolePluginsLoaded) {
      return [];
    }
    return consolePlugins.map((plugin) => {
      const pluginName = plugin?.metadata?.name;
      const loadedPluginInfo = pluginInfo
        .filter(isLoadedDynamicPluginInfo)
        .find(
          (i: LoadedDynamicPluginInfo) => i?.metadata?.name === pluginName,
        ) as LoadedDynamicPluginInfo;
      const notLoadedPluginInfo = pluginInfo
        .filter(isNotLoadedDynamicPluginInfo)
        .find(
          (i: NotLoadedDynamicPluginInfo) => i?.pluginName === pluginName,
        ) as NotLoadedDynamicPluginInfo;
      const enabled = (enabledPlugins ?? []).includes(pluginName);
      if (loadedPluginInfo) {
        return {
          name: plugin?.metadata?.name,
          version: loadedPluginInfo?.metadata?.version,
          description: loadedPluginInfo?.metadata?.customProperties?.console?.description,
          enabled,
          status: {
            state: loadedPluginInfo?.status,
          },
        };
      }
      return {
        name: plugin?.metadata?.name,
        enabled,
        status: {
          state: notLoadedPluginInfo?.status,
          errorMessage:
            notLoadedPluginInfo?.status !== 'Pending'
              ? notLoadedPluginInfo?.errorMessage
              : undefined,
          errorCause:
            notLoadedPluginInfo?.status !== 'Pending'
              ? notLoadedPluginInfo?.errorCause?.toString()
              : undefined,
        },
      };
    });
  }, [pluginInfoLoaded, consolePluginsLoaded, consolePlugins, pluginInfo, enabledPlugins]);
  return [rows, pluginInfoLoaded && consolePluginsLoaded];
};

const ConsolePluginStatus: React.FC<ConsolePluginStatusType> = ({ enabled, plugin }) => {
  const { t } = useTranslation();
  const console: WatchK8sResource = {
    kind: referenceForModel(ConsoleOperatorConfigModel),
    isList: false,
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  };
  const [consoleOperatorConfig] = useK8sWatchResource<K8sResourceKind>(console);
  const canPatchConsoleOperatorConfig = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });
  const labels = enabled ? t('console-app~Enabled') : t('console-app~Disabled');
  return (
    <>
      {consoleOperatorConfig && canPatchConsoleOperatorConfig ? (
        <Button
          data-test="edit-console-plugin"
          type="button"
          isInline
          onClick={() =>
            consolePluginModal({
              consoleOperatorConfig,
              plugin,
              trusted: false,
            })
          }
          variant="link"
        >
          {labels}
          <PencilAltIcon className="co-icon-space-l pf-v5-c-button-icon--plain" />
        </Button>
      ) : (
        <>{labels}</>
      )}
    </>
  );
};

const ConsolePluginsTable: React.FC<ConsolePluginsTableProps> = ({ obj, rows, columns }) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      {obj.spec?.managementState === 'Unmanaged' && (
        <Alert
          className="co-alert"
          variant="info"
          isInline
          title={t(
            'console-app~Console operator spec.managementState is unmanaged. Changes to plugins will have no effect.',
          )}
        />
      )}
      <RequireCreatePermission model={ConsolePluginModel}>
        <div className="co-m-pane__createLink--no-title">
          <Link
            className="co-m-primary-action"
            to={`/k8s/cluster/${consolePluginConcatenatedGVK}/~new`}
          >
            <Button variant="primary" id="yaml-create" data-test="item-create">
              {t('public~Create {{label}}', { label: t(ConsolePluginModel.label) })}
            </Button>
          </Link>
        </div>
      </RequireCreatePermission>
      {rows.length ? (
        <Table aria-label="Console plugins table" ouiaId="ConsolePluginsTable">
          <Thead>
            <Tr>
              {columns.map(({ name, sort }) => (
                <Th sort={sort}>{name}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {rows.map(({ name, version, description, status, enabled }) => (
              <Tr key={name}>
                <Td dataLabel={columns[0].name}>
                  <ResourceLink groupVersionKind={consolePluginGVK} name={name} hideIcon />
                </Td>
                <Td dataLabel={columns[1].name}>{version || DASH}</Td>
                <Td dataLabel={columns[2].name}>{description || DASH}</Td>
                <Td dataLabel={columns[3].name}>
                  {status ? <Status status={status.state} title={status.state} /> : DASH}
                </Td>
                <Td dataLabel={columns[4].name}>
                  {<ConsolePluginStatus plugin={name} enabled={enabled} />}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <EmptyBox label={t('console-app~console plugins')} />
      )}
    </div>
  );
};

type UseConsoleTableState = <RowType = any>(
  columnNames: string[],
  rows: RowType[],
  comparators: RowComparator<RowType>[],
) => [ConsoleTableColumn[], RowType[]];
const useConsoleTableState: UseConsoleTableState = (columnNames, rows, comparators) => {
  const [index, setIndex] = React.useState<number | null>(null);
  const [direction, setDirection] = React.useState<SortByDirection | null>(null);
  const sortBy = React.useMemo<ISortBy>(
    () => ({ index, direction, defaultDirection: SortByDirection.asc }),
    [index, direction],
  );
  const onSort = React.useCallback<OnSort>((_event, newSortIndex, newSortDirection) => {
    setIndex(newSortIndex);
    setDirection(newSortDirection);
  }, []);
  const columns = React.useMemo<ConsoleTableColumn[]>(
    () =>
      columnNames.map((name, columnIndex) => ({
        name,
        sort: {
          columnIndex,
          onSort,
          sortBy,
        },
      })),
    [columnNames, sortBy, onSort],
  );
  const sortedRows = React.useMemo(() => {
    const comparator = comparators?.[index ?? 0]?.[direction || SortByDirection.asc];
    return comparator ? rows.sort(comparator) : rows;
  }, [comparators, direction, index, rows]);
  return [columns, sortedRows];
};

const ConsoleDevPluginsList: React.FCC<ConsolePluginsListProps> = ({ columnNames, obj }) => {
  const [rows, loaded] = useConsolePluginsDevListRows();
  const [columns, sortedRows] = useConsoleTableState<ConsolePluginRow>(
    columnNames,
    rows,
    pluginRowComparators,
  );
  return !loaded ? (
    <LoadingBox />
  ) : (
    <ConsolePluginsTable obj={obj} columns={columns} rows={sortedRows} />
  );
};

const ConsolePluginsList: React.FC<ConsolePluginsListProps> = ({ obj, columnNames }) => {
  const [rows, loaded] = useConsolePluginListRows(obj?.spec?.plugins ?? []);
  const [columns, sortedRows] = useConsoleTableState<ConsolePluginRow>(
    columnNames,
    rows,
    pluginRowComparators,
  );
  return !loaded ? (
    <LoadingBox />
  ) : (
    <ConsolePluginsTable obj={obj} rows={sortedRows} columns={columns} />
  );
};

const ConsoleOperatorConfigPluginsPage: React.FCC<ConsoleOperatorConfigPageProps> = ({ obj }) => {
  const { t } = useTranslation();
  const columnNames = React.useMemo(
    () => [
      t('console-app~Name'),
      t('console-app~Version'),
      t('console-app~Description'),
      t('console-app~Status'),
      t('console-app~Enabled'),
    ],
    [t],
  );
  return developmentMode ? (
    <ConsoleDevPluginsList obj={obj} columnNames={columnNames} />
  ) : (
    <ConsolePluginsList obj={obj} columnNames={columnNames} />
  );
};

export const ConsoleOperatorConfigDetailsPage: React.FC<React.ComponentProps<
  typeof DetailsPage
>> = (props) => {
  const location = useLocation();
  const pages = [
    navFactory.details(DetailsForKind),
    navFactory.editYaml(),
    {
      href: 'console-plugins',
      // t('console-app~Console plugins')
      nameKey: 'console-app~Console plugins',
      component: ConsoleOperatorConfigPluginsPage,
    },
  ];

  const menuActions: KebabAction[] = [
    () => ({
      // t('console-app~Customize')
      labelKey: 'console-app~Customize',
      labelKind: { kind: ConsoleOperatorConfigModel.kind },
      dataTest: `Customize`,
      href: '/cluster-configuration',
      accessReview: asAccessReview(
        ConsoleOperatorConfigModel,
        { spec: { name: 'cluster' } },
        'patch',
      ),
    }),
  ];

  return (
    <DetailsPage
      {...props}
      kind={consoleOperatorConfigReference}
      pages={pages}
      menuActions={menuActions}
      breadcrumbsFor={() =>
        breadcrumbsForGlobalConfig(ConsoleOperatorConfigModel.label, location.pathname)
      }
    />
  );
};

type ConsolePluginRow = {
  description?: string;
  enabled: boolean;
  name: string;
  status: {
    state: string;
    errorMessage?: string;
    errorCause?: string;
  };
  version?: string;
};

type ConsolePluginsTableProps = {
  obj: K8sResourceKind;
  rows: ConsolePluginRow[];
  columns: ConsoleTableColumn[];
};

type Comparator<T extends any = any> = (a: T, b: T) => number;
type RowComparator<RowType = any> = {
  asc: Comparator<RowType>;
  desc: Comparator<RowType>;
};

type ConsoleTableColumn = {
  name: string;
  sort: ThSortType;
};

type ConsolePluginStatusType = {
  enabled: boolean;
  plugin: string;
};

type ConsolePluginsListProps = {
  columnNames: string[];
  obj: K8sResourceKind;
};

type ConsoleOperatorConfigPageProps = {
  obj: K8sResourceKind;
};
