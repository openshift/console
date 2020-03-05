import * as React from 'react';
import * as _ from 'lodash-es';
import { match } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { Alert } from '@patternfly/react-core';

import { serviceCatalogStatus, referenceForModel, K8sResourceKind } from '../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { Kebab, ResourceKebab } from './utils/kebab';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { StatusWithIcon } from './utils/service-catalog-status';
import { ResourceEventStream } from './events';
import { Conditions } from './conditions';
import {
  ServiceCatalogParameters,
  ServiceCatalogParametersSecrets,
} from './service-catalog-parameters';
import { ServiceBindingDescription } from './service-instance';
import { addSecretToWorkload } from './secret';
import { ServiceBindingModel, ServiceInstanceModel } from '../models';

const actionButtons = [addSecretToWorkload];

const menuActions = [...Kebab.factory.common];

const secretLink = (obj) =>
  serviceCatalogStatus(obj) === 'Ready' ? (
    <ResourceLink
      kind="Secret"
      name={obj.spec.secretName}
      title={obj.spec.secretName}
      namespace={obj.metadata.namespace}
    />
  ) : (
    '-'
  );

const ServiceBindingDetails: React.SFC<ServiceBindingDetailsProps> = ({ obj: sb }) => {
  const sbParameters = _.get(sb, 'status.externalProperties.parameters', {});
  const notReady = serviceCatalogStatus(sb) === 'Not Ready' ? true : false;

  return (
    <>
      <div className="co-m-pane__body">
        {notReady && (
          <Alert
            isInline
            className="co-alert"
            variant="warning"
            title="This binding is not ready yet"
          >
            Once it is ready, bind its secret to a workload.
          </Alert>
        )}
        <ServiceBindingDescription
          instanceName={sb.spec.instanceRef.name}
          className="co-m-pane__explanation"
        />
        <SectionHeading text="Service Binding Details" />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={sb} />
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <dt>Service Instance</dt>
              <dd>
                <ResourceLink
                  kind={referenceForModel(ServiceInstanceModel)}
                  name={sb.spec.instanceRef.name}
                  namespace={sb.metadata.namespace}
                />
              </dd>
              <dt>Secret</dt>
              <dd>{secretLink(sb)}</dd>
              <dt>Status</dt>
              <dd>
                <StatusWithIcon obj={sb} />
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={sb.status.conditions} />
      </div>
      {!_.isEmpty(sb.spec.parametersFrom) && <ServiceCatalogParametersSecrets obj={sb} />}
      {!_.isEmpty(sbParameters) && <ServiceCatalogParameters parameters={sbParameters} />}
    </>
  );
};

const pages = [
  navFactory.details(ServiceBindingDetails),
  navFactory.editYaml(),
  navFactory.events(ResourceEventStream),
];
export const ServiceBindingDetailsPage: React.SFC<ServiceBindingDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={referenceForModel(ServiceBindingModel)}
    buttonActions={actionButtons}
    menuActions={menuActions}
    pages={pages}
  />
);
ServiceBindingDetailsPage.displayName = 'ServiceBindingDetailsPage';

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const ServiceBindingsTableHeader = () => {
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
      title: 'Status',
      sortFunc: 'serviceCatalogStatus',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Service Instance',
      sortField: 'spec.instanceRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Secret',
      sortField: 'spec.secretName',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
ServiceBindingsTableHeader.displayName = 'ServiceBindingsTableHeader';

const ServiceBindingsTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(ServiceBindingModel)}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink
          kind="Namespace"
          name={obj.metadata.namespace}
          title={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        <StatusWithIcon obj={obj} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[3], 'co-break-word')}>
        <ResourceLink
          kind={referenceForModel(ServiceInstanceModel)}
          name={obj.spec.instanceRef.name}
          title={obj.spec.instanceRef.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[4], 'co-break-word')}>
        {secretLink(obj)}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab
          actions={menuActions}
          kind={referenceForModel(ServiceBindingModel)}
          resource={obj}
        />
      </TableData>
    </TableRow>
  );
};

const ServiceBindingsList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label="Service Bindings"
    Header={ServiceBindingsTableHeader}
    Row={ServiceBindingsTableRow}
    virtualize
  />
);
ServiceBindingsList.displayName = 'ServiceBindingsList';

export const ServiceBindingsPage: React.SFC<ServiceBindingsPageProps> = (props) => (
  <ListPage
    {...props}
    namespace={props.namespace || _.get(props.match, 'params.ns')}
    showTitle={false}
    kind={referenceForModel(ServiceBindingModel)}
    ListComponent={ServiceBindingsList}
  />
);

export type ServiceBindingDetailsProps = {
  obj: K8sResourceKind;
};

export type ServiceBindingsPageProps = {
  autoFocus?: boolean;
  canCreate?: boolean;
  createHandler?: any;
  filters?: any;
  namespace?: string;
  match?: match<{ ns?: string }>;
  selector?: any;
  showTitle?: boolean;
};

export type ServiceBindingDetailsPageProps = {
  match: any;
};

ServiceBindingsPage.displayName = 'ServiceBindingsListPage';
