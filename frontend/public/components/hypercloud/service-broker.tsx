import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { Status } from '@console/shared';
import { sortable } from '@patternfly/react-table';
import { ServiceBrokerModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { DetailsPage, ListPage, Table, TableData, TableRow, RowFunction } from '../factory';
import { DetailsItem, Kebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, ResourceKebab, Timestamp } from '../utils';

const { common } = Kebab.factory;

const kind = ServiceBrokerModel.kind;

export const serviceBrokerMenuActions = [...Kebab.getExtensionsActionsForKind(ServiceBrokerModel), ...common];

const ServiceBrokerDetails: React.FC<ServiceBrokerDetailsProps> = ({ obj: serviceBroker }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_11')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={serviceBroker} showAnnotations={false} showOwner={false}></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_13')} obj={serviceBroker} path="status.phase">
                <Status status={ServiceBrokerPhase(serviceBroker)} />
              </DetailsItem>
              <dt>URL</dt>
              <dd>{serviceBroker.spec.url}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ServiceBrokerDetailsProps = {
  obj: K8sResourceKind;
};

const { details, editYaml } = navFactory;
const ServiceBrokersDetailsPage: React.FC<ServiceBrokersDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={serviceBrokerMenuActions} pages={[details(ServiceBrokerDetails), editYaml()]} />;
ServiceBrokersDetailsPage.displayName = 'ServiceBrokersDetailsPage';

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-xl'), Kebab.columnClass];

const ServiceBrokerPhase = instance => {
  let phase = '';
  if (instance.status) {
    instance.status.conditions.forEach(cur => {
      if (cur.type === 'Ready') {
        if (cur.status === 'True') {
          phase = 'Running';
        } else {
          phase = 'Error';
        }
      }
    });
    return phase;
  }
};

const ServiceBrokerTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  let phase = ServiceBrokerPhase(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={phase} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={serviceBrokerMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ServiceBrokerTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortFunc: 'ServiceBrokerPhase',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
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

ServiceBrokerTableHeader.displayName = 'ServiceBrokerTableHeader';

const serviceBrokerStatusReducer = (serviceBroker: any): string => {
  return ServiceBrokerPhase(serviceBroker);
};

const ServiceBrokersList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Service Broker" Header={ServiceBrokerTableHeader.bind(null, t)} Row={ServiceBrokerTableRow} virtualize />;
};
ServiceBrokersList.displayName = 'ServiceBrokersList';

const ServiceBrokersPage: React.FC<ServiceBrokersPageProps> = props => {
  const { t } = useTranslation();
  return (
    <ListPage
      title={t('COMMON:MSG_LNB_MENU_11')}
      createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_11') })}
      canCreate={true}
      kind={kind}
      ListComponent={ServiceBrokersList}
      rowFilters={[
        {
          filterGroupName: 'Status',
          type: 'service-broker-status',
          reducer: serviceBrokerStatusReducer,
          items: [
            { id: 'Running', title: t('COMMON:MSG_COMMON_STATUS_1') },
            { id: 'Error', title: 'Error' },
          ],
        },
      ]}
      {...props}
    />
  );
};
ServiceBrokersPage.displayName = 'ServiceBrokersPage';

export { ServiceBrokersList, ServiceBrokersPage, ServiceBrokersDetailsPage };

type ServiceBrokersPageProps = {};

type ServiceBrokersDetailsPageProps = {
  match: any;
};
