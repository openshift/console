import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { K8sResourceKindReference, K8sResourceKind } from '../module/k8s';
import { LimitRangeModel } from '../models';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  Kebab,
  navFactory,
  SectionHeading,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  Timestamp,
} from './utils';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(LimitRangeModel), ...common];

const LimitRangeReference: K8sResourceKindReference = LimitRangeModel.kind;

const tableColumnClasses = [
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

export const LimitRangeTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={LimitRangeReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]} columnID="namespace">
        <ResourceLink
          kind="Namespace"
          name={obj.metadata.namespace}
          title={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={LimitRangeReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export const LimitRangeList: React.FC = (props) => {
  const { t } = useTranslation();
  const LimitRangeTableHeader = () => {
    return [
      {
        title: t('limit-range~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('limit-range~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('limit-range~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ];
  };

  return (
    <Table
      {...props}
      aria-label={LimitRangeModel.labelPlural}
      Header={LimitRangeTableHeader}
      Row={LimitRangeTableRow}
      virtualize
    />
  );
};

export const LimitRangeListPage: React.FC<LimitRangeListPageProps> = (props) => (
  <ListPage
    {...props}
    title={LimitRangeModel.labelPlural}
    kind={LimitRangeReference}
    ListComponent={LimitRangeList}
    canCreate={true}
  />
);

export const LimitRangeDetailsRow: React.SFC<LimitRangeDetailsRowProps> = ({
  limitType,
  resource,
  limit,
}) => {
  return (
    <tr className="co-resource-list__item">
      <td>{limitType}</td>
      <td>{resource}</td>
      <td>{limit.min || '-'}</td>
      <td>{limit.max || '-'}</td>
      <td>{limit.defaultRequest || '-'}</td>
      <td>{limit.default || '-'}</td>
      <td>{limit.maxLimitRequestRatio || '-'}</td>
    </tr>
  );
};

const LimitRangeDetailsRows: React.SFC<LimitRangeDetailsRowsProps> = ({ limit }) => {
  const properties = ['max', 'min', 'default', 'defaultRequest', 'maxLimitRequestRatio'];
  const resources = {};
  _.each(properties, (property) => {
    _.each(limit[property], (value, resource) => _.set(resources, [resource, property], value));
  });

  return (
    <>
      {_.map(resources, (resourceLimit, resource) => (
        <LimitRangeDetailsRow
          key={resource}
          limitType={limit.type}
          resource={resource}
          limit={resourceLimit}
        />
      ))}
    </>
  );
};

export const LimitRangeDetailsList = (resource) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('limit-range~Limits')} />
      <div className="table-responsive">
        <table className="co-m-table-grid co-m-table-grid--bordered table">
          <thead className="co-m-table-grid__head">
            <tr>
              <td>{t('limit-range~Type')}</td>
              <td>{t('limit-range~Resource')}</td>
              <td>{t('limit-range~Min')}</td>
              <td>{t('limit-range~Max')}</td>
              <td>{t('limit-range~Default request')}</td>
              <td>{t('limit-range~Default limit')}</td>
              <td>{t('limit-range~Max limit/request ratio')}</td>
            </tr>
          </thead>
          <tbody className="co-m-table-grid__body">
            {_.map(resource.resource.spec.limits, (limit, index) => (
              <LimitRangeDetailsRows limit={limit} key={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const LimitRangeDetailsPage = (props) => {
  const { t } = useTranslation();
  const Details = ({ obj: rq }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading
          text={t('limit-range~{{resource}} details', { resource: LimitRangeModel.label })}
        />
        <ResourceSummary resource={rq} />
      </div>
      <LimitRangeDetailsList resource={rq} />
    </>
  );
  return (
    <DetailsPage
      {...props}
      menuActions={menuActions}
      pages={[navFactory.details(Details), navFactory.editYaml()]}
    />
  );
};

export type LimitRangeProps = {
  obj: any;
};
export type LimitRangeListPageProps = {
  filterLabel: string;
};
export type LimitRangeDetailsRowsProps = {
  limit: any;
};
export type LimitRangeDetailsRowProps = {
  limitType: string;
  resource: string;
  limit: any;
};
export type LimitRangeHeaderProps = {
  obj: any;
};
