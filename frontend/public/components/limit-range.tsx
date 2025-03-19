import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { K8sResourceKindReference, K8sResourceKind } from '../module/k8s';
import { LimitRangeModel } from '../models';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
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

const tableColumnClasses = ['', '', 'pf-m-hidden pf-m-visible-on-md', Kebab.columnClass];

export const LimitRangeTableRow: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={LimitRangeReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={LimitRangeReference} resource={obj} />
      </TableData>
    </>
  );
};

export const LimitRangeList: React.FC = (props) => {
  const { t } = useTranslation();
  const LimitRangeTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('public~Created'),
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
  <ListPage {...props} kind={LimitRangeReference} ListComponent={LimitRangeList} canCreate={true} />
);

export const LimitRangeDetailsRow: React.SFC<LimitRangeDetailsRowProps> = ({
  limitType,
  resource,
  limit,
}) => {
  return (
    <tr className="pf-v6-c-table__tr">
      <td className="pf-v6-c-table__td">{limitType}</td>
      <td className="pf-v6-c-table__td">{resource}</td>
      <td className="pf-v6-c-table__td">{limit.min || '-'}</td>
      <td className="pf-v6-c-table__td">{limit.max || '-'}</td>
      <td className="pf-v6-c-table__td">{limit.defaultRequest || '-'}</td>
      <td className="pf-v6-c-table__td">{limit.default || '-'}</td>
      <td className="pf-v6-c-table__td">{limit.maxLimitRequestRatio || '-'}</td>
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
      <SectionHeading text={t('public~Limits')} />
      <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
        <thead className="pf-v6-c-table__thead">
          <tr className="pf-v6-c-table__tr">
            <th className="pf-v6-c-table__th">{t('public~Type')}</th>
            <th className="pf-v6-c-table__th">{t('public~Resource')}</th>
            <th className="pf-v6-c-table__th">{t('public~Min')}</th>
            <th className="pf-v6-c-table__th">{t('public~Max')}</th>
            <th className="pf-v6-c-table__th">{t('public~Default request')}</th>
            <th className="pf-v6-c-table__th">{t('public~Default limit')}</th>
            <th className="pf-v6-c-table__th">{t('public~Max limit/request ratio')}</th>
          </tr>
        </thead>
        <tbody className="pf-v6-c-table__tbody">
          {_.map(resource.resource.spec.limits, (limit, index) => (
            <LimitRangeDetailsRows limit={limit} key={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const LimitRangeDetailsPage = (props) => {
  const { t } = useTranslation();
  const Details = ({ obj: rq }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~LimitRange details')} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={rq} />
          </div>
        </div>
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
