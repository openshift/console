import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { EnvoyFilterModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(EnvoyFilterModel), ...Kebab.factory.common];

const kind = EnvoyFilterModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const EnvoyFilterTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortFunc: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Created',
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
EnvoyFilterTableHeader.displayName = 'EnvoyFilterTableHeader';

const EnvoyFilterTableRow: RowFunction<K8sResourceKind> = ({ obj: envoyfilter, index, key, style }) => {
  return (
    <TableRow id={envoyfilter.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={envoyfilter.metadata.name} namespace={envoyfilter.metadata.namespace} title={envoyfilter.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={envoyfilter.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={envoyfilter.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={envoyfilter} />
      </TableData>
    </TableRow>
  );
};

const EnvoyFilterDetails: React.FC<EnvoyFilterDetailsProps> = ({ obj: envoyfilter }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Envoy Filter Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={envoyfilter} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const EnvoyFilters: React.FC = props => <Table {...props} aria-label="Envoy Filters" Header={EnvoyFilterTableHeader} Row={EnvoyFilterTableRow} virtualize />;

export const EnvoyFiltersPage: React.FC<EnvoyFiltersPageProps> = props => <ListPage canCreate={true} ListComponent={EnvoyFilters} kind={kind} {...props} />;

export const EnvoyFiltersDetailsPage: React.FC<EnvoyFiltersDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(EnvoyFilterDetails)), editYaml()]} />;

type EnvoyFilterDetailsProps = {
  obj: K8sResourceKind;
};

type EnvoyFiltersPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type EnvoyFiltersDetailsPageProps = {
  match: any;
};