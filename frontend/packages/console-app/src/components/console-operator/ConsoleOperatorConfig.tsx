import type { FC, ComponentProps } from 'react';
import { useMemo, useState, useCallback } from 'react';
import { PluginInfoEntry } from '@openshift/dynamic-plugin-sdk';
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
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom-v5-compat';
import { useAccessReview, WatchK8sResource } from '@console/dynamic-plugin-sdk';
import {
  getGroupVersionKindForModel,
  getReferenceForModel,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { PluginCSPViolations } from '@console/internal/actions/ui';
import { breadcrumbsForGlobalConfig } from '@console/internal/components/cluster-settings/global-config';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils/horizontal-nav';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { KebabAction } from '@console/internal/components/utils/kebab';
import { asAccessReview, RequireCreatePermission } from '@console/internal/components/utils/rbac';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { EmptyBox } from '@console/internal/components/utils/status-box';
import { ConsoleOperatorConfigModel, ConsolePluginModel } from '@console/internal/models';
import {
  ConsolePluginKind,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceForModel,
} from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { consolePluginModal } from '@console/shared/src/components/modals/ConsolePluginModal';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared/src/components/status/icons';
import { Status } from '@console/shared/src/components/status/Status';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src/constants/resource';
import { DASH } from '@console/shared/src/constants/ui';
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

  return useMemo(
    () => ({ consoleOperatorConfig, consoleOperatorConfigLoaded, canPatchConsoleOperatorConfig }),
    [consoleOperatorConfig, consoleOperatorConfigLoaded, canPatchConsoleOperatorConfig],
  );
};

export const ConsolePluginStatus: FC<ConsolePluginStatusProps> = ({ status, errorMessage }) => (
  <Status status={status} title={status === 'failed' ? errorMessage : undefined} />
);

export const ConsolePluginEnabledStatus: FC<ConsolePluginEnabledStatusProps> = ({
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
          icon={<PencilAltIcon />}
          iconPosition="end"
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
        </Button>
      ) : (
        <>{labels}</>
      )}
    </>
  );
};

export const ConsolePluginCSPStatus: FC<ConsolePluginCSPStatusProps> = ({ hasViolations }) => {
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

const ConsolePluginsTable: FC<ConsolePluginsTableProps> = ({ obj, rows }) => {
  const { t } = useTranslation();

  const [sortBy, setSortBy] = useState<ISortBy>(() => ({
    index: 0,
    direction: SortByDirection.asc,
  }));

  const onSort = useCallback<OnSort>((_event, index, direction) => {
    setSortBy({ index, direction });
  }, []);

  const columns = useMemo<TableColumn[]>(
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

  const compare = useCallback<Comparator<ConsolePluginTableRow>>(
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

  const sortedRows = useMemo(() => rows.sort(compare), [rows, compare]);

  return (
    <PaneBody>
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
          <Link to={`/k8s/cluster/${consolePluginConcatenatedGVK}/~new`}>
            <Button variant="primary" id="yaml-create" data-test="item-create">
              {t('public~Create {{label}}', { label: t(ConsolePluginModel.label) })}
            </Button>
          </Link>
        </div>
      </RequireCreatePermission>
      {rows.length ? (
        <Table
          aria-label="console plugins table"
          ouiaId="ConsolePluginsTable"
          data-test="console-plugins-table"
        >
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
                  <Td dataLabel={columns[0].id} data-test={`${name}-name`}>
                    {!developmentMode ? (
                      <ResourceLink groupVersionKind={consolePluginGVK} name={name} hideIcon />
                    ) : (
                      name
                    )}
                  </Td>
                  <Td dataLabel={columns[1].id} data-test={`${name}-version`}>
                    {version || DASH}
                  </Td>
                  <Td dataLabel={columns[2].id} data-test={`${name}-description`}>
                    {description || DASH}
                  </Td>
                  <Td dataLabel={columns[3].id} data-test={`${name}-status`}>
                    <ConsolePluginStatus status={status} errorMessage={errorMessage} />
                  </Td>
                  <Td dataLabel={columns[4].id} data-test={`${name}-enabled`}>
                    <ConsolePluginEnabledStatus pluginName={name} enabled={enabled} />
                  </Td>
                  <Td dataLabel={columns[5].id} data-test={`${name}-csp-violations`}>
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
    </PaneBody>
  );
};

const DevPluginsPage: FC<ConsoleOperatorConfigPageProps> = (props) => {
  const pluginInfo = usePluginInfo();
  const cspViolations = useSelector<RootState, PluginCSPViolations>(({ UI }) =>
    UI.get('pluginCSPViolations'),
  );

  const rows = useMemo<ConsolePluginTableRow[]>(
    () =>
      pluginInfo
        .filter((plugin) => plugin.status === 'loaded')
        .map((plugin) => ({
          name: plugin.manifest.name,
          version: plugin.manifest.version,
          description: plugin.manifest.customProperties?.console?.description,
          enabled: plugin.enabled,
          status: plugin.status,
          hasCSPViolations: cspViolations[plugin.manifest.name] ?? false,
        })),
    [pluginInfo, cspViolations],
  );
  return <ConsolePluginsTable {...props} rows={rows} />;
};

const PluginsPage: FC<ConsoleOperatorConfigPageProps> = (props) => {
  const pluginInfo = usePluginInfo();
  const [consolePlugins, consolePluginsLoaded] = useK8sWatchResource<ConsolePluginKind[]>({
    isList: true,
    kind: referenceForModel(ConsolePluginModel),
  });
  const enabledPlugins = useMemo(() => props?.obj?.spec?.plugins ?? [], [
    props?.obj?.spec?.plugins,
  ]);
  const cspViolations = useSelector<RootState, PluginCSPViolations>(({ UI }) =>
    UI.get('pluginCSPViolations'),
  );
  const rows = useMemo<ConsolePluginTableRow[]>(() => {
    if (!consolePluginsLoaded) {
      return [];
    }
    return consolePlugins.map((plugin) => {
      const pluginName = plugin?.metadata?.name;
      const enabled = enabledPlugins.includes(pluginName);

      const loadedPluginInfo = pluginInfo
        .filter((p) => p.status === 'loaded')
        .find((i) => i.manifest.name === pluginName);

      const notLoadedPluginInfo = pluginInfo
        .filter((p) => p.status !== 'loaded')
        .find((i) => i.manifest.name === pluginName);

      if (loadedPluginInfo) {
        return {
          name: plugin?.metadata?.name,
          version: loadedPluginInfo?.manifest.version,
          description: loadedPluginInfo?.manifest.customProperties?.console?.description,
          enabled,
          status: loadedPluginInfo?.status,
          hasCSPViolations: cspViolations[loadedPluginInfo?.manifest.name] ?? false,
        };
      }

      return {
        name: plugin?.metadata?.name,
        enabled,
        status: notLoadedPluginInfo?.status,
        errorMessage:
          notLoadedPluginInfo?.status === 'failed' ? notLoadedPluginInfo?.errorMessage : undefined,
        errorCause:
          notLoadedPluginInfo?.status === 'failed'
            ? notLoadedPluginInfo?.errorCause?.toString()
            : undefined,
      };
    });
  }, [consolePluginsLoaded, consolePlugins, pluginInfo, enabledPlugins, cspViolations]);
  return <ConsolePluginsTable {...props} rows={rows} />;
};

const ConsoleOperatorConfigPluginsPage: FC<ConsoleOperatorConfigPageProps> = developmentMode
  ? DevPluginsPage
  : PluginsPage;

export const ConsoleOperatorConfigDetailsPage: FC<ComponentProps<typeof DetailsPage>> = (props) => {
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
  status: PluginInfoEntry['status'];
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
};

type ConsolePluginStatusProps = {
  status: PluginInfoEntry['status'];
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
