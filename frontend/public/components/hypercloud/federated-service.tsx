import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
// import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, LabelList, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Selector, ResourceIcon } from '../utils';
import { ResourceEventStream } from '../events';
import { FederatedServiceModel } from '../../models';

// export const menuActions: KebabAction[] = [AddHealthChecks, Kebab.factory.AddStorage, ...Kebab.getExtensionsActionsForKind(FederatedServiceModel), EditHealthChecks, ...Kebab.factory.common];
export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(FederatedServiceModel), ...Kebab.factory.common];

const kind = FederatedServiceModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedServiceTableHeader = () => {
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
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Selector',
      sortField: 'service.spec.template.spec.selector',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};
FederatedServiceTableHeader.displayName = 'FederatedServiceTableHeader';

// const ServiceAddress = ({ s }) => {
//   const ServiceIPsRow = (name, desc, ips, note = null) => (
//     <div className="co-ip-row">
//       <div className="row">
//         <div className="col-xs-6">
//           <p className="ip-name">{name}</p>
//           <p className="ip-desc">{desc}</p>
//         </div>
//         <div className="col-xs-6">
//           {note && <span className="text-muted">{note}</span>}
//           {ips}
//         </div>
//       </div>
//     </div>
//   );

//   const ServiceType = type => {
//     switch (type) {
//       case 'NodePort':
//         return ServiceIPsRow('Node Port', 'Accessible outside the cluster', _.map(s.spec?.template?.spec?.ports, 'nodePort'), '(all nodes): ');
//       case 'LoadBalancer':
//         return ServiceIPsRow(
//           'External Load Balancer',
//           'Ingress point(s) of load balancer',
//           '', // federated service의 load balancer의 ip는 어떻게 가져오지?
//         );
//       case 'ExternalName':
//         return ServiceIPsRow('External Service Name', 'Location of the resource that backs the service', [s.spec?.template?.spec?.externalName]);
//       default:
//         return '';
//     }
//   };

//   return (
//     <div>
//       <div className="row co-ip-header">
//         <div className="col-xs-6">Type</div>
//         <div className="col-xs-6">Location</div>
//       </div>
//       <div className="rows">{ServiceType(s.spec?.template?.spec?.type)}</div>
//     </div>
//   );
// };

const ServicePortMapping = ({ ports }) => {
  return (
    <div>
      <div className="row co-ip-header">
        <div className="col-xs-3">Name</div>
        <div className="col-xs-3">Port</div>
        <div className="col-xs-3">Protocol</div>
        <div className="col-xs-3">Target Port</div>
      </div>
      <div className="rows">
        {ports.map((portObj, i) => {
          return (
            <div className="co-ip-row" key={i}>
              <div className="row">
                <div className="col-xs-3 co-text-service">
                  <p>{portObj.name || '-'}</p>
                  {portObj.nodePort && <p className="co-text-node">Node Port</p>}
                </div>
                <div className="col-xs-3 co-text-service">
                  <p>
                    <ResourceIcon kind="Service" />
                    <span>{portObj.port}</span>
                  </p>
                  {portObj.nodePort && (
                    <p className="co-text-node">
                      <ResourceIcon kind="Node" />
                      <span>{portObj.nodePort}</span>
                    </p>
                  )}
                </div>
                <div className="col-xs-3">
                  <p>{portObj.protocol}</p>
                </div>
                <div className="col-xs-3 co-text-pod">
                  <p>
                    <ResourceIcon kind="Pod" />
                    <span>{portObj.targetPort}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FederatedServiceTableRow: RowFunction<K8sResourceKind> = ({ obj: service, index, key, style }) => {
  console.log('obj? ', service);
  return (
    <TableRow id={service.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={service.metadata.name} namespace={service.metadata.namespace} title={service.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={service.metadata.namespace} title={service.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={service.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Selector selector={service.spec?.template?.spec?.selector} namespace={service.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={service} />
      </TableData>
    </TableRow>
  );
};

const FederatedServiceDetails: React.FC<FederatedServiceDetailsProps> = ({ obj: service }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Federated Service Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={service} />
        </div>
        <div className="col-sm-6">
          <SectionHeading text="Service Routing" />
          <dl>
            {/* <dt>Service Address</dt>
            <dd className="service-ips">
              <ServiceAddress s={service} />
            </dd> */}
            <DetailsItem label="Service Port Mapping" obj={service} path="spec.ports">
              <div className="service-ips">{service.spec?.template?.spec?.ports ? <ServicePortMapping ports={service.spec.template.spec.ports} /> : '-'}</div>
            </DetailsItem>
          </dl>
        </div>
      </div>
    </div>
  </>
);

const { details, editYaml, events } = navFactory;
export const FederatedServices: React.FC = props => <Table {...props} aria-label="Federated Services" Header={FederatedServiceTableHeader} Row={FederatedServiceTableRow} virtualize />;

export const FederatedServicesPage: React.FC<FederatedServicesPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedServices} kind={kind} {...props} />;

export const FederatedServicesDetailsPage: React.FC<FederatedServicesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedServiceDetails)), editYaml(), events(ResourceEventStream)]} />;

type FederatedServiceDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedServicesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedServicesDetailsPageProps = {
  match: any;
};
