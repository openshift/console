import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import { Link } from 'react-router-dom-v5-compat';
import { K8sResourceKind, referenceForModel } from '../module/k8s';
import { TableData } from './factory';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  Kebab,
  KebabAction,
  LabelList,
  ResourceKebab,
  ResourceLink,
  resourcePath,
  Selector,
} from './utils';
import { DASH, LazyActionMenu } from '@console/shared';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import {
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
} from '@console/app/src/components/data-view/types';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { RowProps, TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';

const tableColumnClasses = [
  '',
  '',
  css('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-v6-u-w-16-on-lg'),
  css('pf-m-hidden', 'pf-m-visible-on-lg'),
  css('pf-m-hidden', 'pf-m-visible-on-lg'),
  Kebab.columnClass,
];

export const WorkloadTableRow: React.FC<WorkloadTableRowProps> = ({
  obj,
  kind,
  menuActions,
  customActionMenu,
  customData,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Link
          to={`${resourcePath(kind, obj.metadata.name, obj.metadata.namespace)}/pods`}
          title="pods"
        >
          {t('public~{{statusReplicas}} of {{specReplicas}} pods', {
            statusReplicas: obj.status.replicas || 0,
            specReplicas: obj.spec.replicas,
          })}
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={obj.spec.selector} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {customActionMenu || (
          <ResourceKebab actions={menuActions} kind={kind} resource={obj} customData={customData} />
        )}
      </TableData>
    </>
  );
};
WorkloadTableRow.displayName = 'WorkloadTableRow';
type WorkloadTableRowProps = {
  obj: K8sResourceKind;
  kind: string;
  menuActions?: KebabAction[];
  customActionMenu?: React.ReactNode; // Renders a custom action menu.
  customData?: { [key: string]: any };
};

export const WorkloadTableHeader = () => {
  return [
    {
      title: i18next.t('public~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: i18next.t('public~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: i18next.t('public~Status'),
      sortFunc: 'numReplicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: i18next.t('public~Labels'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: i18next.t('public~Pod selector'),
      sortField: 'spec.selector',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
WorkloadTableHeader.displayName = 'WorkloadTableHeader';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'status' },
  { id: 'labels' },
  { id: 'selector' },
  { id: '' },
];

export const ReplicasCount: React.FCC<ReplicasCountProps> = ({ obj, kind }) => {
  const { t } = useTranslation();
  return (
    <Link to={`${resourcePath(kind, obj.metadata.name, obj.metadata.namespace)}/pods`} title="pods">
      {t('public~{{statusReplicas}} of {{specReplicas}} pods', {
        statusReplicas: obj.status.replicas || 0,
        specReplicas: obj.spec.replicas,
      })}
    </Link>
  );
};

export const getWorkloadDataViewRows = <T extends K8sResourceKind>(
  data: RowProps<T, any>[],
  columns: ConsoleDataViewColumn<T>[],
  model: K8sModel,
): ConsoleDataViewRow[] => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const resourceKind = referenceForModel(model);
    const context = { [resourceKind]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <span className="co-resource-item">
            <ResourceLink
              groupVersionKind={getGroupVersionKindForModel(model)}
              name={name}
              namespace={namespace}
            />
          </span>
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <ReplicasCount obj={obj} kind={resourceKind} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <LabelList kind={resourceKind} labels={obj.metadata.labels} />,
      },
      [tableColumnInfo[4].id]: {
        cell: <Selector selector={obj.spec.selector} namespace={obj.metadata.namespace} />,
      },
      [tableColumnInfo[5].id]: {
        cell: <LazyActionMenu context={context} />,
        props: {
          ...actionsCellProps,
        },
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

export const useWorkloadColumns = <T extends K8sResourceKind>(): TableColumn<T>[] => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Status'),
        id: tableColumnInfo[2].id,
        sort: 'status.replicas',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Labels'),
        id: tableColumnInfo[3].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: t('public~Pod selector'),
        id: tableColumnInfo[4].id,
        sort: 'spec.selector',
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

type ReplicasCountProps = {
  obj: K8sResourceKind;
  kind: string;
};
