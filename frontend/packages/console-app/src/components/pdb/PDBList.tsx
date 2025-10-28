import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { YellowExclamationTriangleIcon } from '@console/dynamic-plugin-sdk';
import {
  TableColumn,
  ColumnLayout,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceLink, Selector } from '@console/internal/components/utils';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  LazyActionMenu,
  DASH,
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
} from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { PodDisruptionBudgetModel } from '../../models';
import { getPDBTableColumns, tableColumnInfo } from './pdb-table-columns';
import { PodDisruptionBudgetKind } from './types';
import { isDisruptionViolated } from './utils/get-pdb-resources';

const pdbColumnManagementID = referenceForModel(PodDisruptionBudgetModel);

const getDataViewRows: GetDataViewRows<PodDisruptionBudgetKind, undefined> = (data, columns) => {
  return data.map(({ obj: pdb }) => {
    const { name, namespace } = pdb.metadata;
    const resourceKind = referenceForModel(PodDisruptionBudgetModel);
    const context = { [resourceKind]: pdb };
    const isPDBViolated = isDisruptionViolated(pdb);

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={resourceKind} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <Selector selector={pdb.spec.selector} namespace={namespace} />,
      },
      [tableColumnInfo[3].id]: {
        cell:
          _.isNil(pdb.spec.maxUnavailable) && _.isNil(pdb.spec.minAvailable)
            ? DASH
            : _.isNil(pdb.spec.maxUnavailable)
            ? `Min available ${pdb.spec.minAvailable}`
            : `Max unavailable ${pdb.spec.maxUnavailable}`,
      },
      [tableColumnInfo[4].id]: {
        cell: (
          <>
            {pdb.status.disruptionsAllowed}{' '}
            {isPDBViolated && (
              <Tooltip content="Disruption not allowed">
                <YellowExclamationTriangleIcon />
              </Tooltip>
            )}
          </>
        ),
      },
      [tableColumnInfo[5].id]: {
        cell: <Timestamp timestamp={pdb.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={context} />,
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

const getPDBColumns = (): TableColumn<PodDisruptionBudgetKind>[] => {
  const sharedColumns = getPDBTableColumns();

  return sharedColumns.map((col, index) => ({
    title: col.title,
    id: col.id,
    sort: col.sort,
    props: {
      ...cellIsStickyProps,
      modifier: 'nowrap',
      ...(index === sharedColumns.length - 1 && { ...cellIsStickyProps }),
    },
  }));
};

const PodDisruptionBudgetList: React.FCC<PodDisruptionBudgetsListProps> = ({
  data,
  loaded,
  ...props
}) => {
  const { t } = useTranslation();
  const columns = getPDBColumns();
  const [selectedColumns] = useUserSettingsCompatibility(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    undefined,
    true,
  );

  const columnLayout = React.useMemo<ColumnLayout>(
    () => ({
      columns: columns
        .filter((column) => column.title && column.title.trim() !== '')
        .map((column) => _.pick(column, ['title', 'additional', 'id'])),
      id: pdbColumnManagementID,
      selectedColumns:
        selectedColumns?.[pdbColumnManagementID]?.length > 0
          ? new Set(selectedColumns[pdbColumnManagementID])
          : null,
      type: t('console-app~PodDisruptionBudget'),
      showNamespaceOverride: false,
    }),
    [columns, selectedColumns, t],
  );

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<PodDisruptionBudgetKind>
        {...props}
        label={PodDisruptionBudgetModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        columnLayout={columnLayout}
        columnManagementID={pdbColumnManagementID}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
      />
    </React.Suspense>
  );
};

export default PodDisruptionBudgetList;

type PodDisruptionBudgetsListProps = {
  data: PodDisruptionBudgetKind[];
  loaded: boolean;
  loadError?: any;
  [key: string]: any;
};
