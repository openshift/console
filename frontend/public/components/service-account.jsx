import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { DetailsPage, ListPage, Table, TableData } from './factory';
import {
  Kebab,
  SectionHeading,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  Timestamp,
} from './utils';
import { ServiceAccountModel } from '../models';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(ServiceAccountModel), ...common];

const kind = 'ServiceAccount';

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-md',
  Kebab.columnClass,
];

const ServiceAccountTableRow = ({ obj: serviceaccount }) => {
  const {
    metadata: { name, namespace, uid, creationTimestamp },
    secrets,
  } = serviceaccount;
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={name} namespace={namespace} title={uid} />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={namespace} title={namespace} /> {}
      </TableData>
      <TableData className={tableColumnClasses[2]}>{secrets ? secrets.length : 0}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={serviceaccount} />
      </TableData>
    </>
  );
};

const Details = ({ obj: serviceaccount }) => {
  const { t } = useTranslation();

  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('public~ServiceAccount details')} />
      <div className="row">
        <div className="col-md-6">
          <ResourceSummary resource={serviceaccount} />
        </div>
      </div>
    </div>
  );
};

const ServiceAccountsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[navFactory.details(Details), navFactory.editYaml()]}
  />
);

const ServiceAccountsList = (props) => {
  const { t } = useTranslation();
  const ServiceAccountTableHeader = () => {
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
        title: t('public~Secrets'),
        sortField: 'secrets',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[4] },
      },
    ];
  };
  ServiceAccountTableHeader.displayName = 'ServiceAccountTableHeader';

  return (
    <Table
      {...props}
      aria-label={t('public~ServiceAccounts')}
      Header={ServiceAccountTableHeader}
      Row={ServiceAccountTableRow}
      virtualize
    />
  );
};
const ServiceAccountsPage = (props) => (
  <ListPage ListComponent={ServiceAccountsList} {...props} canCreate={true} />
);
export { ServiceAccountsList, ServiceAccountsPage, ServiceAccountsDetailsPage };
