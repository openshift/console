import * as React from 'react';
import { Alert, Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import {
  ISortBy,
  sortable,
  SortByDirection,
  TableGridBreakpoint,
  TableVariant,
} from '@patternfly/react-table';
import {
  Table as TableDeprecated,
  TableHeader as TableHeaderDeprecated,
  TableBody as TableBodyDeprecated,
} from '@patternfly/react-table/deprecated';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom-v5-compat';
import { useAccessReview, WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { breadcrumbsForGlobalConfig } from '@console/internal/components/cluster-settings/global-config';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import {
  asAccessReview,
  EmptyBox,
  KebabAction,
  LoadingBox,
  navFactory,
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
import { consolePluginModal, CONSOLE_OPERATOR_CONFIG_NAME, Status } from '@console/shared';

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

const ConsolePluginsList: React.FC<ConsolePluginsListType> = ({ obj }) => {
  const { t } = useTranslation();
  const [consolePlugins, consolePluginsLoaded] = useK8sWatchResource<ConsolePluginKind[]>({
    isList: true,
    kind: referenceForModel(ConsolePluginModel),
  });
  const [pluginInfoEntries] = useDynamicPluginInfo();
  const [rows, setRows] = React.useState([]);
  const [sortBy, setSortBy] = React.useState<ISortBy>({});
  const pluginColumns = ['name', 'version', 'description', 'status'];
  const developmentMode = window.SERVER_FLAGS.k8sMode === 'off-cluster';
  React.useEffect(() => {
    const placeholder = '-';
    if (developmentMode) {
      const data = pluginInfoEntries.filter(isLoadedDynamicPluginInfo).map((plugin) => {
        return {
          name: plugin.metadata.name,
          version: plugin.metadata.version,
          description: plugin.metadata?.customProperties?.console?.description || placeholder,
          enabled: plugin.enabled,
          status: plugin.status,
        };
      });
      setRows(
        data?.map((item) => {
          return {
            cells: [
              {
                title: item.name,
              },
              item.version,
              item.description,
              {
                title: <Status status={item.status} title={item.status} />,
              },
              {
                title: t('console-app~Enabled'),
              },
            ],
          };
        }),
      );
      return;
    }
    const data = consolePlugins.map((plugin) => {
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
      const enabled = !!obj?.spec?.plugins?.includes(pluginName);
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
    const sortedData = !_.isEmpty(sortBy)
      ? data.sort((a, b) => {
          const sortCol = pluginColumns[sortBy.index];
          if ((a[sortCol] || placeholder) < (b[sortCol] || placeholder)) {
            return -1;
          }
          if ((a[sortCol] || placeholder) > (b[sortCol] || placeholder)) {
            return 1;
          }
          return 0;
        })
      : data;
    if (sortBy && sortBy?.direction === SortByDirection.desc) {
      sortedData.reverse();
    }
    setRows(
      sortedData?.map((item) => {
        return {
          cells: [
            {
              title: (
                <ResourceLink
                  kind={referenceForModel(ConsolePluginModel)}
                  name={item.name}
                  hideIcon
                />
              ),
            },
            item.version || placeholder,
            item.description || placeholder,
            item.status
              ? {
                  title: (
                    <Status status={item.status} title={item.status}>
                      {item.errorMessage} <br /> {item.errorCause}
                    </Status>
                  ),
                }
              : placeholder,
            {
              title: <ConsolePluginStatus plugin={item.name} enabled={item.enabled} />,
            },
          ],
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consolePlugins, pluginInfoEntries, obj, sortBy]);
  const headers = [
    {
      title: t('console-app~Name'),
      transforms: developmentMode ? [] : [sortable],
    },
    {
      title: t('console-app~Version'),
      transforms: developmentMode ? [] : [sortable],
    },
    {
      title: t('console-app~Description'),
      transforms: developmentMode ? [] : [sortable],
    },
    {
      title: t('console-app~Status'),
      transforms: developmentMode ? [] : [sortable],
    },
    { title: '' },
  ];
  const onSort = (e, index, direction) => {
    setSortBy({
      index,
      direction,
    });
  };

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
      {rows.length ? (
        <TableDeprecated
          aria-label={t('console-app~Console plugins table')}
          cells={headers}
          gridBreakPoint={TableGridBreakpoint.none}
          onSort={onSort}
          rows={rows}
          sortBy={sortBy}
          variant={TableVariant.compact}
        >
          <TableHeaderDeprecated />
          <TableBodyDeprecated />
        </TableDeprecated>
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

type ConsolePluginStatusType = {
  enabled: boolean;
  plugin: string;
};

type ConsolePluginsListType = {
  obj: K8sResourceKind;
};
