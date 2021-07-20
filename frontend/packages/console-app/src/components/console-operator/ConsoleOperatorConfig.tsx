import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';
import {
  ISortBy,
  sortable,
  SortByDirection,
  Table,
  TableBody,
  TableGridBreakpoint,
  TableHeader,
  TableVariant,
} from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { breadcrumbsForGlobalConfig } from '@console/internal/components/cluster-settings/global-config';
import { DetailsForKind } from '@console/internal/components/default-resource';
import { DetailsPage } from '@console/internal/components/factory';
import { EmptyBox, LoadingBox, navFactory, ResourceLink } from '@console/internal/components/utils';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { ConsoleOperatorConfigModel, ConsolePluginModel } from '@console/internal/models';
import {
  ConsolePluginKind,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceForModel,
} from '@console/internal/module/k8s';
import { DynamicPluginInfo, isLoadedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { useDynamicPluginInfo } from '@console/plugin-sdk/src/api/useDynamicPluginInfo';
import { consolePluginModal } from '@console/shared/src/components/modals';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src/constants';

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
          <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
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
  const dynamicPluginInfo: DynamicPluginInfo[] = useDynamicPluginInfo();
  const [rows, setRows] = React.useState([]);
  const [sortBy, setSortBy] = React.useState<ISortBy>({});
  React.useEffect(() => {
    const data = consolePlugins.map((plugin) => {
      const pluginName = plugin?.metadata?.name;
      const loadedPluginInfo = dynamicPluginInfo
        .filter(isLoadedDynamicPluginInfo)
        .find((i) => i?.metadata?.name === pluginName);
      const enabled = !!obj?.spec?.plugins?.includes(pluginName);
      return {
        name: plugin?.metadata?.name,
        version: loadedPluginInfo?.metadata?.version,
        description: loadedPluginInfo?.metadata?.description,
        enabled,
      };
    });
    const placeholder = '-';
    setRows(
      data?.map((item) => {
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
            {
              title: <ConsolePluginStatus plugin={item.name} enabled={item.enabled} />,
            },
          ],
        };
      }),
    );
  }, [consolePlugins, dynamicPluginInfo, obj]);
  const headers = [
    {
      title: t('console-app~Name'),
      transforms: [sortable],
    },
    {
      title: t('console-app~Version'),
      transforms: [sortable],
    },
    {
      title: t('console-app~Description'),
      transforms: [sortable],
    },
    {
      title: t('console-app~Status'),
      transforms: [sortable],
    },
  ];
  const onSort = (e, index, direction) => {
    const sortedRows = rows.sort((a, b) =>
      a[index] < b[index] ? -1 : a[index] > b[index] ? 1 : 0,
    );
    setSortBy({
      index,
      direction,
    });
    setRows(direction === SortByDirection.asc ? sortedRows : sortedRows.reverse());
  };

  return consolePluginsLoaded ? (
    <div className="co-m-pane__body">
      {rows.length ? (
        <Table
          aria-label={t('console-app~Console plugins table')}
          cells={headers}
          gridBreakPoint={TableGridBreakpoint.none}
          onSort={onSort}
          rows={rows}
          sortBy={sortBy}
          variant={TableVariant.compact}
        >
          <TableHeader />
          <TableBody />
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
  const pages = [
    navFactory.details(DetailsForKind(props.kind)),
    navFactory.editYaml(),
    {
      href: 'console-plugins',
      // t('console-app~Console plugins')
      nameKey: 'console-app~Console plugins',
      component: ConsolePluginsList,
    },
  ];

  return (
    <DetailsPage
      {...props}
      kind={consoleOperatorConfigReference}
      pages={pages}
      breadcrumbsFor={() =>
        breadcrumbsForGlobalConfig(ConsoleOperatorConfigModel.label, props.match.url)
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
