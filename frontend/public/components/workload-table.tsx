import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Link } from 'react-router-dom';
import { K8sResourceKind } from '../module/k8s';
import { TableRow, TableData } from './factory';
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

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  Kebab.columnClass,
];

export const WorkloadTableRow: React.FC<WorkloadTableRowProps> = ({
  obj,
  index,
  rowKey,
  style,
  kind,
  menuActions,
  customData,
}) => {
  const { t } = useTranslation();
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={rowKey} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
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
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} customData={customData} />
      </TableData>
    </TableRow>
  );
};
WorkloadTableRow.displayName = 'WorkloadTableRow';
type WorkloadTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  rowKey: string;
  style: object;
  kind: string;
  menuActions: KebabAction[];
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
