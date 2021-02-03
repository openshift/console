import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
// import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, LabelList, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Timestamp } from '../utils';
import { ResourceEventStream } from '../events';
import { FederatedNamespaceModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(FederatedNamespaceModel), ...Kebab.factory.common];
// export const menuActions: KebabAction[] = [AddHealthChecks, Kebab.factory.AddStorage, ...Kebab.getExtensionsActionsForKind(FederatedNamespaceModel), EditHealthChecks, ...Kebab.factory.common];

const kind = FederatedNamespaceModel.kind;

const tableColumnClasses = ['', classNames('pf-m-hidden', 'pf-m-visible-on-sm'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedNamespaceTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
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
FederatedNamespaceTableHeader.displayName = 'FederatedNamespaceTableHeader';

const FederatedNamespaceTableRow: RowFunction<K8sResourceKind> = ({ obj: namespace, index, key, style }) => {
  console.log('obj? ', namespace);
  return (
    <TableRow id={namespace.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={namespace.metadata.name} namespace={namespace.metadata.namespace} title={namespace.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <LabelList kind={kind} labels={namespace.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={namespace.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={namespace} />
      </TableData>
    </TableRow>
  );
};

const FederatedNamespaceDetails: React.FC<FederatedNamespaceDetailsProps> = ({ obj: namespace }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated Namespace Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={namespace} />
        </div>
      </div>
    </div>
  </>
);

const { details, editYaml, events } = navFactory;
export const FederatedNamespaces: React.FC = props => <Table {...props} aria-label="Federated Namespaces" Header={FederatedNamespaceTableHeader} Row={FederatedNamespaceTableRow} virtualize />;

export const FederatedNamespacesPage: React.FC<FederatedNamespacesPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedNamespaces} kind={kind} {...props} />;

export const FederatedNamespacesDetailsPage: React.FC<FederatedNamespacesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedNamespaceDetails)), editYaml(), events(ResourceEventStream)]} />;

type FederatedNamespaceDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedNamespacesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedNamespacesDetailsPageProps = {
  match: any;
};
