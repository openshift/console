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
  DynamicPluginInfo,
  isNotLoadedDynamicPluginInfo,
} from '@console/plugin-sdk/src';
import { useDynamicPluginInfo } from '@console/plugin-sdk/src/api/useDynamicPluginInfo';
import {
  consolePluginModal,
  CONSOLE_OPERATOR_CONFIG_NAME,
  DASH,
  Status,
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import {
  boolComparator,
  localeComparator,
  Comparator,
} from '@console/shared/src/utils/comparators';

export const developmentMode = window.SERVER_FLAGS.k8sMode === 'off-cluster';
const consolePluginGVK = getGroupVersionKindForModel(ConsolePluginModel);
const consolePluginConcatenatedGVK = getReferenceForModel(ConsolePluginModel);
const consoleOperatorConfigReference: K8sResourceKindReference = referenceForModel(
  ConsoleOperatorConfigModel,
);

export const useConsoleOperatorConfigData = () => {
  const console: WatchK8sResource = {
    kind: referenceForModel(ConsoleOperatorConfigModel),
    isList: false,
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  };

  const [consoleOperatorConfig, consoleOperatorConfigLoaded] = useK8sWatchResource<K8sResourceKind>(
    console,
  );

  const canPatchConsoleOperatorConfig = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });

  return React.useMemo(
    () => ({ consoleOperatorConfig, consoleOperatorConfigLoaded, canPatchConsoleOperatorConfig }),
    [consoleOperatorConfig, consoleOperatorConfigLoaded, canPatchConsoleOperatorConfig],
  );
};

export const ConsolePluginStatus: React.FC<ConsolePluginStatusProps> = ({
  status,
  errorMessage,
}) => <Status status={status} title={status === 'Failed' ? errorMessage : undefined} />;

export const ConsolePluginEnabledStatus: React.FC<ConsolePluginEnabledStatusProps> = ({
  pluginName,
  enabled,
}) => {
  const { t } = useTranslation();

  const {
    consoleOperatorConfig,
    consoleOperatorConfigLoaded,
    canPatchConsoleOperatorConfig,
  } = useConsoleOperatorConfigData();

  const labels = enabled ? t('console-app~Enabled') : t('console-app~Disabled');

  return (
    <>
      {consoleOperatorConfigLoaded && canPatchConsoleOperatorConfig && !developmentMode ? (
        <Button
          data-test="edit-console-plugin"
          type="button"
          isInline
          onClick={() =>
            consolePluginModal({
              consoleOperatorConfig,
              pluginName,
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

export const ConsolePluginCSPStatus: React.FC<ConsolePluginCSPStatusProps> = ({
  hasViolations,
}) => {
  const { t } = useTranslation();

  return hasViolations ? (
    <>
      <YellowExclamationTriangleIcon
        className="co-icon-space-r"
        title={t(
          "console-app~This plugin might have violated the Console Content Security Policy. Refer to the browser's console logs for details.",
        )}
      />{' '}
      {t('console-app~Yes')}
    </>
  ) : (
    <>
      <GreenCheckCircleIcon className="co-icon-space-r" /> {t('console-app~No')}
    </>
  );
};

const ConsolePluginsTable: React.FC<ConsolePluginsTableProps> = ({ obj, rows, loaded }) => {
  const { t } = useTranslation();

  const [sortBy, setSortBy] = React.useState<ISortBy>(() => ({
    index: 0,
    direction: SortByDirection.asc,
  }));

  const onSort = React.useCallback<OnSort>((_event, index, direction) => {
    setSortBy({ index, direction });
  }, []);

  const columns = React.useMemo<TableColumn[]>(
    () => [
      {
        id: 'name',
        name: t('console-app~Name'),
        sortable: true,
      },
      {
        id: 'version',
        name: t('console-app~Version'),
      },
      {
        id: 'description',
        name: t('console-app~Description'),
      },
      {
        id: 'status',
        name: t('console-app~Status'),
        sortable: true,
      },
      {
        id: 'enabled',
        name: t('console-app~Enabled'),
        sortable: true,
      },
      {
        id: 'csp-violations',
        name: t('console-app~CSP violations'),
      },
    ],
    [t],
  );

  const compare = React.useCallback<Comparator<ConsolePluginTableRow>>(
    (a, b) => {
      const { index, direction } = sortBy;
      const { id } = columns[index];
      const desc = direction === SortByDirection.desc;
      const left = (desc ? b : a)[id];
      const right = (desc ? a : b)[id];
      switch (id) {
        case 'enabled':
          return boolComparator(left, right);
        default:
          return localeComparator(left, right);
      }
    },
    [columns, sortBy],
  );

  const sortedRows = React.useMemo(() => rows.sort(compare), [rows, compare]);

  return !loaded ? (
    <LoadingBox />
  ) : (
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
        <Table aria-label="console plugins table" ouiaId="ConsolePluginsTable">
          <Thead>
            <Tr>
              {columns.map(({ id, name, sortable }, columnIndex) => (
                <Th key={id} sort={sortable ? { sortBy, onSort, columnIndex } : null}>
                  {name}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {sortedRows.map(
              ({ name, version, description, status, enabled, errorMessage, hasCSPViolations }) => (
                <Tr key={name}>
                  <Td dataLabel={columns[0].id}>
                    {!developmentMode ? (
                      <ResourceLink groupVersionKind={consolePluginGVK} name={name} hideIcon />
                    ) : (
                      name
                    )}
                  </Td>
                  <Td dataLabel={columns[1].id}>{version || DASH}</Td>
                  <Td dataLabel={columns[2].id}>{description || DASH}</Td>
                  <Td dataLabel={columns[3].id}>
                    <ConsolePluginStatus status={status} errorMessage={errorMessage} />
                  </Td>
                  <Td dataLabel={columns[4].id}>
                    <ConsolePluginEnabledStatus pluginName={name} enabled={enabled} />
                  </Td>
                  <Td dataLabel={columns[5].id}>
                    <ConsolePluginCSPStatus hasViolations={hasCSPViolations ?? false} />
                  </Td>
                </Tr>
              ),
            )}
          </Tbody>
        </Table>
      ) : (
        <EmptyBox label={t('console-app~Console plugins')} />
      )}
    </div>
  );
};

const DevPluginsPage: React.FCC<ConsoleOperatorConfigPageProps> = (props) => {
  const [pluginInfo, pluginInfoLoaded] = useDynamicPluginInfo();
  const rows = React.useMemo<ConsolePluginTableRow[]>(
    () =>
      !pluginInfoLoaded
        ? []
        : pluginInfo.filter(isLoadedDynamicPluginInfo).map((plugin) => ({
            name: plugin.metadata.name,
            version: plugin.metadata.version,
            description: plugin.metadata?.customProperties?.console?.description,
            enabled: plugin.enabled,
            status: plugin.status,
            hasCSPViolations: plugin.hasCSPViolations,
          })),
    [pluginInfo, pluginInfoLoaded],
  );
  return <ConsolePluginsTable {...props} rows={rows} loaded={pluginInfoLoaded} />;
};

const PluginsPage: React.FC<ConsoleOperatorConfigPageProps> = (props) => {
  const [pluginInfo, pluginInfoLoaded] = useDynamicPluginInfo();
  const [consolePlugins, consolePluginsLoaded] = useK8sWatchResource<ConsolePluginKind[]>({
    isList: true,
    kind: referenceForModel(ConsolePluginModel),
  });
  const enabledPlugins = React.useMemo(() => props?.obj?.spec?.plugins ?? [], [
    props?.obj?.spec?.plugins,
  ]);
  const rows = React.useMemo<ConsolePluginTableRow[]>(() => {
    if (!pluginInfoLoaded || !consolePluginsLoaded) {
      return [];
    }
    return consolePlugins.map((plugin) => {
      const pluginName = plugin?.metadata?.name;
      const enabled = enabledPlugins.includes(pluginName);
      const loadedPluginInfo = pluginInfo
        .filter(isLoadedDynamicPluginInfo)
        .find((i) => i?.metadata?.name === pluginName);
      const notLoadedPluginInfo = pluginInfo
        .filter(isNotLoadedDynamicPluginInfo)
        .find((i) => i?.pluginName === pluginName);
      if (loadedPluginInfo) {
        return {
          name: plugin?.metadata?.name,
          version: loadedPluginInfo?.metadata?.version,
          description: loadedPluginInfo?.metadata?.customProperties?.console?.description,
          enabled,
          status: loadedPluginInfo?.status,
          hasCSPViolations: loadedPluginInfo?.hasCSPViolations,
        };
      }
      return {
        name: plugin?.metadata?.name,
        enabled,
        status: notLoadedPluginInfo?.status,
        errorMessage:
          notLoadedPluginInfo?.status === 'Failed' ? notLoadedPluginInfo?.errorMessage : undefined,
        errorCause:
          notLoadedPluginInfo?.status === 'Failed'
            ? notLoadedPluginInfo?.errorCause?.toString()
            : undefined,
      };
    });
  }, [pluginInfoLoaded, consolePluginsLoaded, consolePlugins, pluginInfo, enabledPlugins]);
  return (
    <ConsolePluginsTable {...props} rows={rows} loaded={pluginInfoLoaded && consolePluginsLoaded} />
  );
};

const ConsoleOperatorConfigPluginsPage: React.FC<ConsoleOperatorConfigPageProps> = developmentMode
  ? DevPluginsPage
  : PluginsPage;

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

export type ConsolePluginTableRow = {
  name: string;
  version?: string;
  description?: string;
  status: DynamicPluginInfo['status'];
  enabled: boolean;
  errorMessage?: string;
  hasCSPViolations?: boolean;
};

type TableColumn = {
  id: string;
  name: string;
  sortable?: boolean;
};

type ConsolePluginsTableProps = ConsoleOperatorConfigPageProps & {
  rows: ConsolePluginTableRow[];
  loaded: boolean;
};

type ConsolePluginStatusProps = {
  status: DynamicPluginInfo['status'];
  errorMessage?: string;
};

type ConsolePluginEnabledStatusProps = {
  pluginName: string;
  enabled: boolean;
};

type ConsolePluginCSPStatusProps = {
  hasViolations: boolean;
};

type ConsoleOperatorConfigPageProps = {
  obj: K8sResourceKind;
};
