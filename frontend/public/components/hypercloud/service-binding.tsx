import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { ServiceBindingModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { Kebab, ResourceKebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, Timestamp } from '../utils';

const { common } = Kebab.factory;

const kind = ServiceBindingModel.kind;

export const serviceBindingMenuActions = [...Kebab.getExtensionsActionsForKind(ServiceBindingModel), common[0], common[1], common[3]];

const ServiceBindingDetails: React.FC<ServiceBindingDetailsProps> = ({ obj: serviceBinding }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Service Binding Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={serviceBinding} showPodSelector showNodeSelector showOwner={false}></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt> SERVICE INSTANCE</dt>
              <dd>
                <ResourceLink kind="ServiceInstance" name={serviceBinding.spec.instanceRef.name} namespace={serviceBinding.metadata.namespace} title={serviceBinding.spec.instanceRef.name} />
              </dd>
              <dt> SECRET</dt>
              <dd>
                <ResourceLink kind="Secret" name={serviceBinding.spec.secretName} namespace={serviceBinding.metadata.namespace} title={serviceBinding.spec.secretName} />
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ServiceBindingDetailsProps = {
  obj: K8sResourceKind;
};

const { details, editYaml } = navFactory;
const ServiceBindingsDetailsPage: React.FC<ServiceBindingsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={serviceBindingMenuActions} pages={[details(ServiceBindingDetails), editYaml()]} />;
ServiceBindingsDetailsPage.displayName = 'ServiceBindingsDetailsPage';

const tableColumnClasses = [
  '', // NAME
  '', // NAMESPACE
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // SERVICE INSTANCE
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), // SECRET
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CREATED
  Kebab.columnClass, // MENU ACTIONS
];

const ServiceBindingTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <ResourceLink kind="ServiceInstance" name={obj.spec.instanceRef.name} namespace={obj.metadata.namespace} title={obj.spec.instanceRef.name} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceLink kind="Secret" name={obj.spec.secretName} namespace={obj.metadata.namespace} title={obj.spec.secretName} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={serviceBindingMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ServiceBindingTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Service Instance',
      sortField: 'spec.instanceRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Secret',
      sortField: 'spec.secretName',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

ServiceBindingTableHeader.displayName = 'ServiceBindingTableHeader';

const ServiceBindingsList: React.FC = props => <Table {...props} aria-label="Service Binding" Header={ServiceBindingTableHeader} Row={ServiceBindingTableRow} />;
ServiceBindingsList.displayName = 'ServiceBindingsList';

const ServiceBindingsPage: React.FC<ServiceBindingsPageProps> = props => {
  return <ListPage canCreate={true} kind={kind} ListComponent={ServiceBindingsList} {...props} />;
};
ServiceBindingsPage.displayName = 'ServiceBindingsPage';

export { ServiceBindingsList, ServiceBindingsPage, ServiceBindingsDetailsPage };

type ServiceBindingsPageProps = {};

type ServiceBindingsDetailsPageProps = {
  match: any;
};
