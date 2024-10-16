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
  ThProps,
  Tr,
} from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom-v5-compat';
import * as SemVer from 'semver';
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

const consolePluginGVK = getGroupVersionKindForModel(ConsolePluginModel);
const consolePluginConcatenatedGVK = getReferenceForModel(ConsolePluginModel);
const stringComparator = (a: string, b: string): number => a.localeCompare(b);
const boolComparator = (a: boolean, b: boolean): number => (a ? 1 : 0) - (b ? 1 : 0);
const looseVersionCompare = (a: string, b: string): number => SemVer.compare(a, b, true);

const consoleOperatorConfigReference: K8sResourceKindReference = referenceForModel(
  ConsoleOperatorConfigModel,
);

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

type UseTableSort = () => [ISortBy, OnSort];
const useTableSort: UseTableSort = () => {
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
  return [sortBy, onSort];
};

const ConsolePluginsList: React.FC<ConsolePluginsListType> = ({ obj }) => {
  const { t } = useTranslation();
  const developmentMode = window.SERVER_FLAGS.k8sMode === 'off-cluster';
  const enabledPlugins = React.useMemo(() => obj?.spec?.plugins ?? [], [obj?.spec?.plugins]);
  const [consolePlugins, consolePluginsLoaded] = useK8sWatchResource<ConsolePluginKind[]>({
    isList: true,
    kind: referenceForModel(ConsolePluginModel),
  });
  const [pluginInfoEntries] = useDynamicPluginInfo();
  const [sortBy, onSort] = useTableSort();

  const columns: ConsolePluginColumn[] = React.useMemo(
    () => [
      {
        key: 'name',
        displayName: t('console-app~Name'),
        sort: { sortBy, onSort, columnIndex: 0 },
        comparator: stringComparator,
      },
      {
        key: 'version',
        displayName: t('console-app~Version'),
        sort: { sortBy, onSort, columnIndex: 1 },
        comparator: looseVersionCompare,
      },
      {
        key: 'description',
        displayName: t('console-app~Description'),
        sort: { sortBy, onSort, columnIndex: 2 },
        comparator: stringComparator,
      },
      {
        key: 'status',
        displayName: t('console-app~Status'),
        sort: { sortBy, onSort, columnIndex: 3 },
        comparator: stringComparator,
      },
      {
        key: 'enabled',
        displayName: t('console-app~Enabled'),
        sort: { sortBy, onSort, columnIndex: 4 },
        comparator: boolComparator,
      },
    ],
    [t, sortBy, onSort],
  );

  const pluginRows: ConsolePluginRow[] = React.useMemo(() => {
    if (developmentMode) {
      return pluginInfoEntries.filter(isLoadedDynamicPluginInfo).map((plugin) => {
        return {
          name: plugin.metadata.name,
          version: plugin.metadata.version,
          description: plugin.metadata?.customProperties?.console?.description || DASH,
          enabled: plugin.enabled,
          status: plugin.status,
        };
      });
    }
    return consolePlugins.map((plugin) => {
      const pluginName = plugin?.metadata?.name;
      const loadedPluginInfo = pluginInfoEntries
        .filter(isLoadedDynamicPluginInfo)
        .find(
          (i: LoadedDynamicPluginInfo) => i?.metadata?.name === pluginName,
        ) as LoadedDynamicPluginInfo;
      const notLoadedPluginInfo = pluginInfoEntries
        .filter(isNotLoadedDynamicPluginInfo)
        .find(
          (i: NotLoadedDynamicPluginInfo) => i?.pluginName === pluginName,
        ) as NotLoadedDynamicPluginInfo;
      const enabled = enabledPlugins.includes(pluginName);
      if (loadedPluginInfo) {
        return {
          name: plugin?.metadata?.name,
          version: loadedPluginInfo?.metadata?.version,
          description: loadedPluginInfo?.metadata?.customProperties?.console?.description,
          enabled,
          status: loadedPluginInfo?.status,
        };
      }
      return {
        name: plugin?.metadata?.name,
        enabled,
        status: notLoadedPluginInfo?.status,
        errorMessage:
          notLoadedPluginInfo?.status !== 'Pending' ? notLoadedPluginInfo?.errorMessage : undefined,
        errorCause:
          notLoadedPluginInfo?.status !== 'Pending'
            ? notLoadedPluginInfo?.errorCause?.toString()
            : undefined,
      };
    });
  }, [consolePlugins, developmentMode, enabledPlugins, pluginInfoEntries]);

  const sortedPlugins = React.useMemo<ConsolePluginRow[]>(() => {
    const { index, direction } = sortBy;
    const { comparator, key } = columns[index ?? 0];
    return pluginRows.sort((rowA, rowB) => {
      const a = rowA[key];
      const b = rowB[key];
      switch (direction) {
        case SortByDirection.asc:
          return comparator(a, b);
        case SortByDirection.desc:
          return comparator(b, a);
        default:
          return comparator(a, b);
      }
    });
  }, [columns, pluginRows, sortBy]);

  return consolePluginsLoaded ? (
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
      {sortedPlugins.length ? (
        <Table aria-label="Sortable table" ouiaId="SortableTable">
          <Thead>
            <Tr>
              {columns.map(({ displayName, sort }) => (
                <Th sort={sort}>{displayName}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {sortedPlugins.map(({ name, version, description, status, enabled }) => (
              <Tr key={name}>
                <Td dataLabel={columns[0].key}>
                  <ResourceLink groupVersionKind={consolePluginGVK} name={name} hideIcon />
                </Td>
                <Td dataLabel={columns[1].key}>{version || DASH}</Td>
                <Td dataLabel={columns[2].key}>{description || DASH}</Td>
                <Td dataLabel={columns[3].key}>
                  {status ? <Status status={status} title={status} /> : DASH}
                </Td>
                <Td dataLabel={columns[4].key}>
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
  ) : (
    <LoadingBox />
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
      component: ConsolePluginsList,
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
  name: string;
  enabled: boolean;
  status: string;
  version?: string;
  description?: string;
  errorMessage?: string;
  errorCause?: string;
};

type ConsolePluginColumn = {
  key: string;
  displayName: string;
  sort: ThProps['sort'];
  comparator: (a: any, b: any) => number;
};

type ConsolePluginStatusType = {
  enabled: boolean;
  plugin: string;
};

type ConsolePluginsListType = {
  obj: K8sResourceKind;
};
