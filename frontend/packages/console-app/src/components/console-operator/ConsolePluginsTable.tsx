import type { FC } from 'react';
import { useMemo, useCallback, useState } from 'react';
import type { PluginInfoEntry } from '@openshift/dynamic-plugin-sdk';
import { Alert, Button } from '@patternfly/react-core';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import type { DataViewFilterOption } from '@patternfly/react-data-view/dist/esm/DataViewFilters';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  ConsoleDataView,
  getNameCellProps,
  getNameColumnProps,
  initialFiltersDefault,
} from '@console/app/src/components/data-view/ConsoleDataView';
import {
  createSelectionCell,
  createSelectionColumn,
} from '@console/app/src/components/data-view/dataViewSelectionHelpers';
import type {
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
  ResourceFilters,
} from '@console/app/src/components/data-view/types';
import { useDataViewSelection } from '@console/app/src/components/data-view/useDataViewSelection';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type {
  RowProps,
  TableColumn,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ListPageBody, ListPageHeader } from '@console/dynamic-plugin-sdk/src/lib-core';
import {
  getGroupVersionKindForModel,
  getReferenceForModel,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import type { PluginCSPViolations } from '@console/internal/actions/ui';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { RequireCreatePermission } from '@console/internal/components/utils/rbac';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { ConsolePluginModel } from '@console/internal/models';
import type { ConsolePluginKind, K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DASH } from '@console/shared/src/constants/ui';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import {
  ConsolePluginCSPStatus,
  ConsolePluginEnabledStatus,
  ConsolePluginStatus,
  developmentMode,
  useConsoleOperatorConfigData,
} from './ConsolePluginStatus';
import { useConsolePluginBulkActions } from './useConsolePluginBulkActions';

const consolePluginGVK = getGroupVersionKindForModel(ConsolePluginModel);
const consolePluginConcatenatedGVK = getReferenceForModel(ConsolePluginModel);

export interface ConsolePluginTableRow {
  name: string;
  version?: string;
  description?: string;
  status: PluginInfoEntry['status'];
  enabled: boolean;
  errorMessage?: string;
  hasCSPViolations?: boolean;
}

interface PluginFilters extends ResourceFilters {
  status: string[];
  enabled: string[];
}

const pluginColumnInfo = Object.freeze({
  name: { id: 'name' },
  version: { id: 'version' },
  description: { id: 'description' },
  status: { id: 'status' },
  enabled: { id: 'enabled' },
  cspViolations: { id: 'csp-violations' },
});

const usePluginColumns = (
  canBulkEdit: boolean,
): {
  columns: TableColumn<ConsolePluginTableRow>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('console-app');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(ConsolePluginModel);

  const columns = useMemo(
    () => [
      ...(canBulkEdit ? [createSelectionColumn<ConsolePluginTableRow>()] : []),
      {
        title: t('Name'),
        id: pluginColumnInfo.name.id,
        sort: 'name',
        resizableProps: getResizableProps(pluginColumnInfo.name.id),
        props: getNameColumnProps(true, canBulkEdit),
      },
      {
        title: t('Version'),
        id: pluginColumnInfo.version.id,
        resizableProps: getResizableProps(pluginColumnInfo.version.id),
      },
      {
        title: t('Description'),
        id: pluginColumnInfo.description.id,
        resizableProps: getResizableProps(pluginColumnInfo.description.id),
      },
      {
        title: t('Status'),
        id: pluginColumnInfo.status.id,
        sort: 'status',
        resizableProps: getResizableProps(pluginColumnInfo.status.id),
      },
      {
        title: t('Enabled'),
        id: pluginColumnInfo.enabled.id,
        sort: (data: ConsolePluginTableRow[], direction: SortByDirection) =>
          [...data].sort((a, b) => {
            const result = Number(a.enabled) - Number(b.enabled);
            return direction === SortByDirection.desc ? -result : result;
          }),
        resizableProps: getResizableProps(pluginColumnInfo.enabled.id),
      },
      {
        title: t('CSP violations'),
        id: pluginColumnInfo.cspViolations.id,
        resizableProps: getResizableProps(pluginColumnInfo.cspViolations.id),
      },
    ],
    [t, getResizableProps, canBulkEdit],
  );

  return { columns, resetAllColumnWidths };
};

const getPluginDataViewRows = (
  rowData: RowProps<ConsolePluginTableRow>[],
  tableColumns: ConsoleDataViewColumn<ConsolePluginTableRow>[],
  selection?: {
    selectedItems: Set<string>;
    onSelect: (itemId: string, isSelecting: boolean) => void;
  },
  enabledStatusProps?: {
    consoleOperatorConfig: K8sResourceKind;
    canPatch: boolean;
  },
): ConsoleDataViewRow[] =>
  rowData.map(({ obj: plugin }, rowIndex) => {
    const rowCells = {
      select: selection
        ? createSelectionCell({
            rowIndex,
            itemId: plugin.name,
            isSelected: selection.selectedItems.has(plugin.name),
            onSelect: selection.onSelect,
          })
        : undefined,
      [pluginColumnInfo.name.id]: {
        cell: !developmentMode ? (
          <ResourceLink groupVersionKind={consolePluginGVK} name={plugin.name} hideIcon />
        ) : (
          plugin.name
        ),
        props: getNameCellProps(plugin.name, !developmentMode),
      },
      [pluginColumnInfo.version.id]: {
        cell: plugin.version || DASH,
        props: { 'data-test': `${plugin.name}-version` },
      },
      [pluginColumnInfo.description.id]: {
        cell: plugin.description || DASH,
        props: { 'data-test': `${plugin.name}-description` },
      },
      [pluginColumnInfo.status.id]: {
        cell: <ConsolePluginStatus status={plugin.status} errorMessage={plugin.errorMessage} />,
        props: { 'data-test': `${plugin.name}-status` },
      },
      [pluginColumnInfo.enabled.id]: {
        cell: (
          <ConsolePluginEnabledStatus
            pluginName={plugin.name}
            enabled={plugin.enabled}
            consoleOperatorConfig={enabledStatusProps?.consoleOperatorConfig}
            canPatch={enabledStatusProps?.canPatch}
          />
        ),
        props: { 'data-test': `${plugin.name}-enabled` },
      },
      [pluginColumnInfo.cspViolations.id]: {
        cell: <ConsolePluginCSPStatus hasViolations={plugin.hasCSPViolations ?? false} />,
        props: { 'data-test': `${plugin.name}-csp-violations` },
      },
    };

    return tableColumns.map(({ id }) => {
      const rowCell = rowCells[id];
      if (!rowCell) {
        return { id, cell: DASH };
      }
      const cellContent = id === 'select' ? (rowCell.cell ?? '') : (rowCell.cell ?? DASH);
      return {
        id,
        props: rowCell.props,
        cell: cellContent,
      };
    });
  });

const getPluginObjectMetadata = (row: ConsolePluginTableRow) => ({
  name: row.name,
});

type ConsolePluginsTableProps = {
  obj: K8sResourceKind;
  rows: ConsolePluginTableRow[];
  loaded: boolean;
  isListPage?: boolean;
};

const CreateConsolePluginButton: FC = () => {
  const { t } = useTranslation('console-app');

  return (
    <RequireCreatePermission model={ConsolePluginModel}>
      <div className="co-m-pane__createLink--no-title">
        <Link to={`/k8s/cluster/${consolePluginConcatenatedGVK}/~new`}>
          <Button variant="primary" id="yaml-create" data-test="item-create">
            {t('Create {{label}}', { label: t(ConsolePluginModel.labelKey) })}
          </Button>
        </Link>
      </div>
    </RequireCreatePermission>
  );
};

const ConsolePluginsTable: FC<ConsolePluginsTableProps> = ({
  obj,
  rows,
  loaded,
  isListPage = false,
}) => {
  const { t } = useTranslation('console-app');
  const { canPatchConsoleOperatorConfig } = useConsoleOperatorConfigData();
  const canBulkEdit = !developmentMode && canPatchConsoleOperatorConfig;
  const { columns, resetAllColumnWidths } = usePluginColumns(canBulkEdit);

  const { selectedIds, onSelectItem, onSelectAll, clearSelection } = useDataViewSelection({
    data: rows,
    getItemId: (row) => row.name,
  });

  const [filteredSelectedPlugins, setFilteredSelectedPlugins] = useState<ConsolePluginTableRow[]>(
    [],
  );

  const handleFilteredSelectionChange = useCallback((items: ConsolePluginTableRow[]) => {
    setFilteredSelectedPlugins(items);
  }, []);

  const bulkActions = useConsolePluginBulkActions({
    selectedPlugins: filteredSelectedPlugins,
    consoleOperatorConfig: obj,
    onComplete: clearSelection,
  });

  const customActions = canBulkEdit ? bulkActions : undefined;

  const getDataViewRows = useCallback(
    (
      rowData: RowProps<ConsolePluginTableRow>[],
      tableColumns: ConsoleDataViewColumn<ConsolePluginTableRow>[],
    ) =>
      getPluginDataViewRows(
        rowData,
        tableColumns,
        canBulkEdit
          ? {
              selectedItems: selectedIds,
              onSelect: onSelectItem,
            }
          : undefined,
        obj
          ? {
              consoleOperatorConfig: obj,
              canPatch: canPatchConsoleOperatorConfig,
            }
          : undefined,
      ),
    [canBulkEdit, selectedIds, onSelectItem, obj, canPatchConsoleOperatorConfig],
  );

  const statusFilterOptions = useMemo<DataViewFilterOption[]>(
    () => [
      { value: 'loaded', label: t('Loaded') },
      { value: 'pending', label: t('Pending') },
      { value: 'failed', label: t('Failed') },
    ],
    [t],
  );

  const enabledFilterOptions = useMemo<DataViewFilterOption[]>(
    () => [
      { value: 'true', label: t('Enabled') },
      { value: 'false', label: t('Disabled') },
    ],
    [t],
  );

  const initialFilters = useMemo<PluginFilters>(
    () => ({
      ...initialFiltersDefault,
      status: [],
      enabled: [],
    }),
    [],
  );

  const additionalFilterNodes = useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="status"
        filterId="status"
        title={t('Status')}
        placeholder={t('Filter by status')}
        options={statusFilterOptions}
      />,
      <DataViewCheckboxFilter
        key="enabled"
        filterId="enabled"
        title={t('Enabled')}
        placeholder={t('Filter by enablement')}
        options={enabledFilterOptions}
      />,
    ],
    [t, statusFilterOptions, enabledFilterOptions],
  );

  const matchesAdditionalFilters = useCallback(
    (row: ConsolePluginTableRow, filters: PluginFilters) => {
      if (filters.status.length > 0 && !filters.status.includes(row.status)) {
        return false;
      }
      if (filters.enabled.length > 0 && !filters.enabled.includes(String(row.enabled))) {
        return false;
      }
      return true;
    },
    [],
  );

  const getItemId = useCallback((row: ConsolePluginTableRow) => row.name, []);

  const selectionProps = useMemo(
    () =>
      !canBulkEdit
        ? undefined
        : {
            selectedItems: selectedIds,
            onSelect: onSelectItem,
            onSelectAll,
            getItemId,
            onFilteredSelectionChange: handleFilteredSelectionChange,
          },
    [canBulkEdit, selectedIds, onSelectItem, onSelectAll, getItemId, handleFilteredSelectionChange],
  );

  const Wrapper = isListPage ? ListPageBody : PaneBody;

  return (
    <>
      <ListPageHeader title={isListPage ? t(ConsolePluginModel.labelPluralKey) : ''}>
        <CreateConsolePluginButton />
      </ListPageHeader>
      <Wrapper>
        {obj?.spec?.managementState === 'Unmanaged' && (
          <Alert
            className="co-alert"
            variant="info"
            isInline
            title={t(
              "The console operator is unmanaged, so your plugin changes won't take effect. To enable console management, set the management state to Managed.",
            )}
          />
        )}
        <ConsoleDataView<ConsolePluginTableRow, undefined, PluginFilters>
          label={t('Console plugins')}
          data={rows}
          loaded={loaded}
          columns={columns}
          getDataViewRows={getDataViewRows}
          getObjectMetadata={getPluginObjectMetadata}
          initialFilters={initialFilters}
          additionalFilterNodes={additionalFilterNodes}
          matchesAdditionalFilters={matchesAdditionalFilters}
          hideLabelFilter
          hideColumnManagement
          isResizable
          resetAllColumnWidths={resetAllColumnWidths}
          selection={selectionProps}
          customActions={customActions}
        />
      </Wrapper>
    </>
  );
};

const DevPluginsPage: FC<ConsoleOperatorConfigPageProps> = (props) => {
  const pluginInfo = usePluginInfo();
  const cspViolations = useConsoleSelector<PluginCSPViolations>(({ UI }) =>
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

  return <ConsolePluginsTable obj={props.obj} isListPage={props.isListPage} rows={rows} loaded />;
};

const useConsolePluginRows = (enabledPlugins: string[]) => {
  const pluginInfo = usePluginInfo();
  const [consolePlugins, consolePluginsLoaded] = useK8sWatchResource<ConsolePluginKind[]>({
    isList: true,
    kind: referenceForModel(ConsolePluginModel),
  });
  const cspViolations = useConsoleSelector<PluginCSPViolations>(({ UI }) =>
    UI.get('pluginCSPViolations'),
  );

  const rows = useMemo<ConsolePluginTableRow[]>(() => {
    if (!consolePluginsLoaded) {
      return [];
    }
    const pluginInfoByName = new Map(pluginInfo.map((p) => [p.manifest.name, p]));

    return consolePlugins.map((plugin) => {
      const pluginName = plugin?.metadata?.name;
      const enabled = enabledPlugins.includes(pluginName);
      const info = pluginInfoByName.get(pluginName);

      if (info?.status === 'loaded') {
        return {
          name: pluginName,
          version: info.manifest.version,
          description: info.manifest.customProperties?.console?.description,
          enabled,
          status: info.status,
          hasCSPViolations: cspViolations[pluginName] ?? false,
        };
      }

      return {
        name: pluginName,
        enabled,
        status: info?.status,
        errorMessage: info?.status === 'failed' ? info.errorMessage : undefined,
      };
    });
  }, [consolePluginsLoaded, consolePlugins, pluginInfo, enabledPlugins, cspViolations]);

  return { rows, loaded: consolePluginsLoaded };
};

const PluginsPage: FC<ConsoleOperatorConfigPageProps> = (props) => {
  const enabledPlugins = useMemo(
    () => props?.obj?.spec?.plugins ?? [],
    [props?.obj?.spec?.plugins],
  );
  const { rows, loaded } = useConsolePluginRows(enabledPlugins);

  return (
    <ConsolePluginsTable
      obj={props.obj}
      rows={rows}
      loaded={loaded}
      isListPage={props.isListPage}
    />
  );
};

const PluginsPageComponent = developmentMode ? DevPluginsPage : PluginsPage;

export const ConsolePluginsListPage: FC<{ showTitle?: boolean }> = ({ showTitle = true }) => {
  const { consoleOperatorConfig, consoleOperatorConfigLoaded } = useConsoleOperatorConfigData();

  if (!consoleOperatorConfigLoaded) {
    return <LoadingBox blame="ConsolePluginsListPage" />;
  }

  return <PluginsPageComponent obj={consoleOperatorConfig} isListPage={showTitle} />;
};

type ConsoleOperatorConfigPageProps = {
  obj: K8sResourceKind;
  isListPage?: boolean;
};
