import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ResourceDataView,
} from '@console/app/src/components/data-view/ResourceDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { YellowExclamationTriangleIcon } from '@console/dynamic-plugin-sdk';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ResourceLink, Selector } from '@console/internal/components/utils';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { referenceFor } from '@console/internal/module/k8s';
import { LazyActionMenu, DASH } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { PodDisruptionBudgetModel } from '../../models';
import { PodDisruptionBudgetKind } from './types';
import { isDisruptionViolated } from './utils/get-pdb-resources';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'selector' },
  { id: 'minAvailable' },
  { id: 'disruptionsAllowed' },
  { id: 'creationTimestamp' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<PodDisruptionBudgetKind, undefined> = (data, columns) => {
  return data.map(({ obj: pdb }) => {
    const { name, namespace } = pdb.metadata;
    const resourceKind = referenceFor(pdb);
    const context = { [resourceKind]: pdb };
    const isPDBViolated = isDisruptionViolated(pdb);

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(PodDisruptionBudgetModel)}
            name={name}
            namespace={namespace}
          />
        ),
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

const usePDBColumns = () => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
      {
        title: t('console-app~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Selector'),
        id: tableColumnInfo[2].id,
        sort: 'spec.selector',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Availability'),
        id: tableColumnInfo[3].id,
        sort: 'spec.minAvailable',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Allowed disruptions'),
        id: tableColumnInfo[4].id,
        sort: 'status.disruptionsAllowed',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Created'),
        id: tableColumnInfo[5].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const PodDisruptionBudgetList: React.FC<PodDisruptionBudgetsListProps> = ({
  data,
  loaded,
  ...props
}) => {
  const columns = usePDBColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ResourceDataView<PodDisruptionBudgetKind>
        {...props}
        label={PodDisruptionBudgetModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
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
