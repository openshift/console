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
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom-v5-compat';
import { useAccessReview, WatchK8sResource } from '@console/dynamic-plugin-sdk';
import {
  getGroupVersionKindForModel,
  getReference,
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
import { isLoadedDynamicPluginInfo, DynamicPluginInfo } from '@console/plugin-sdk/src';
import { useDynamicPluginInfo } from '@console/plugin-sdk/src/api/useDynamicPluginInfo';
import {
  consolePluginModal,
  CONSOLE_OPERATOR_CONFIG_NAME,
  Status,
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';

const developmentMode = window.SERVER_FLAGS.k8sMode === 'off-cluster';
const pluginColumns = ['name', 'version', 'description', 'status'];
const placeholder = '-';

const consoleOperatorConfigReference: K8sResourceKindReference = referenceForModel(
  ConsoleOperatorConfigModel,
);

const ConsolePluginEnabledStatus: React.FC<ConsolePluginEnabledStatusProps> = ({
  pluginName,
  enabled,
}) => {
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
              plugin: pluginName,
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

const ConsolePluginCSPStatus: React.FC<ConsolePluginCSPStatusProps> = ({ hasViolations }) => {
  const { t } = useTranslation();

  return hasViolations ? (
    <>
      <YellowExclamationTriangleIcon
        className="co-icon-space-r"
        title={t(
          "console-app~This plugin seems to have violated Console Content Security Policy. Refer to the browser's console logs for details.",
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

type ConsolePluginDisplayData = {
  name: string;
  version?: string;
  description?: string;
  status: 'Pending' | 'Loaded' | 'Failed';
  enabled: boolean;
  errorMessage?: string;
  errorCause?: string;
  hasCSPViolations?: boolean;
};

const getConsolePluginDisplayData = (plugin: DynamicPluginInfo): ConsolePluginDisplayData => {
  if (isLoadedDynamicPluginInfo(plugin)) {
    return {
      name: plugin.metadata.name,
      version: plugin.metadata.version,
      description: plugin.metadata.customProperties?.console?.description,
      status: plugin.status,
      enabled: plugin.enabled,
      hasCSPViolations: plugin.hasCSPViolations,
    };
  }

  return {
    name: plugin.pluginName,
    status: plugin.status,
    enabled: false,
    errorMessage: plugin.status === 'Failed' ? plugin.errorMessage : undefined,
    errorCause: plugin.status === 'Failed' ? plugin.errorCause?.toString() : undefined,
  };
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

  React.useEffect(() => {
    const getFailedPluginStatusContent = (item: ConsolePluginDisplayData) =>
      item.status === 'Failed' ? (
        <>
          {item.errorMessage ?? t('console-app~No error message available')}
          <br />
          {item.errorCause ?? t('console-app~No error cause data available')}
        </>
      ) : null;

    const data = pluginInfoEntries.map(getConsolePluginDisplayData);

    if (developmentMode) {
      setRows(
        data.map((item) => ({
          cells: [
            {
              title: item.name,
            },
            item.version ?? placeholder,
            item.description ?? placeholder,
            {
              title: (
                <Status status={item.status} title={item.status}>
                  {getFailedPluginStatusContent(item)}
                </Status>
              ),
            },
            {
              title: item.enabled ? t('console-app~Enabled') : t('console-app~Disabled'),
            },
            {
              title: <ConsolePluginCSPStatus hasViolations={item.hasCSPViolations ?? false} />,
            },
          ],
        })),
      );
      return;
    }

    data.forEach((item) => {
      // Replace "enabled in the PluginStore" status with "enabled on the cluster" status.
      // Note: we should add a separate column instead of having this semantic discrepancy
      // between development (off-cluster) vs. non-development (on-cluster) environment.
      item.enabled = !!obj?.spec?.plugins?.includes(item.name);
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
      sortedData.map((item) => ({
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
          item.version ?? placeholder,
          item.description ?? placeholder,
          {
            title: (
              <Status status={item.status} title={item.status}>
                {getFailedPluginStatusContent(item)}
              </Status>
            ),
          },
          {
            title: <ConsolePluginEnabledStatus pluginName={item.name} enabled={item.enabled} />,
          },
          {
            title: <ConsolePluginCSPStatus hasViolations={item.hasCSPViolations ?? false} />,
          },
        ],
      })),
    );
  }, [consolePlugins, pluginInfoEntries, t, obj, sortBy]);

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
    {
      title: t('console-app~Enabled'),
    },
    {
      title: t('console-app~CSP violations'),
    },
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
      <RequireCreatePermission model={ConsolePluginModel}>
        <div className="co-m-pane__createLink--no-title">
          <Link
            className="co-m-primary-action"
            to={`/k8s/cluster/${getReference(
              getGroupVersionKindForModel(ConsolePluginModel),
            )}/~new`}
          >
            <Button variant="primary" id="yaml-create" data-test="item-create">
              {t('public~Create {{label}}', { label: t(ConsolePluginModel.label) })}
            </Button>
          </Link>
        </div>
      </RequireCreatePermission>
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
        <EmptyBox label={t('console-app~Console plugins')} />
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

type ConsolePluginEnabledStatusProps = {
  pluginName: string;
  enabled: boolean;
};

type ConsolePluginCSPStatusProps = {
  hasViolations: boolean;
};

type ConsolePluginsListType = {
  obj: K8sResourceKind;
};
