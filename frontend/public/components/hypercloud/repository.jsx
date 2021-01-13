import * as React from 'react';
import * as classNames from 'classnames';
import { ListPage, Table, TableData, TableRow } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { sortable } from '@patternfly/react-table';

export const menuActions = [...Kebab.factory.common];

const kind = 'Repository';

const tableColumnClasses = [
    '',
    classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    Kebab.columnClass,
];

const RepositoryTableRow = ({ obj, index, key, style }) => {
    return (
      <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink
            kind={kind}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
            title={obj.metadata.uid}
          />
        </TableData>
        <TableData className={tableColumnClasses[1]}>
          <Timestamp timestamp={obj.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
        </TableData>
      </TableRow>
    );
  };

const RepositoryTableHeader = () => {
    return [
      {
        title: 'Name',
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: 'Created',
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[2] },
      },
    ];
  };
  
  RepositoryTableHeader.displayName = 'RepositoryTableHeader';


const RepositoriesList = (props) => (
    <Table
      {...props}
      aria-label="Repositories"
      Header={RepositoryTableHeader}
      Row={RepositoryTableRow}
      virtualize
    />
  );
  const RepositoriesPage = (props) => {
    const { canCreate = true } = props;
    return (
      <ListPage canCreate={canCreate} kind="Repository" ListComponent={RepositoriesList} {...props} />
    );
  };

export { RepositoriesPage };