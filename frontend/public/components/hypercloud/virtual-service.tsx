import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { VirtualServiceModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(VirtualServiceModel), ...Kebab.factory.common];

const kind = VirtualServiceModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const VirtualServiceTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortFunc: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_28'),
      sortField: 'spec.hosts',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Gateway',
      sortField: 'spec.gateways',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
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
VirtualServiceTableHeader.displayName = 'VirtualServiceTableHeader';

const VirtualServiceTableRow: RowFunction<K8sResourceKind> = ({ obj: virtualservice, index, key, style }) => {
  let hosts = virtualservice.spec.hosts ? virtualservice.spec.hosts.map(host => host + ' ') : '';
  let gateways = virtualservice.spec.gateways ? virtualservice.spec.gateways.map(gateway => gateway + ' ') : '';

  return (
    <TableRow id={virtualservice.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={virtualservice.metadata.name} namespace={virtualservice.metadata.namespace} title={virtualservice.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={virtualservice.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {hosts}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {gateways}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={virtualservice.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={virtualservice} />
      </TableData>
    </TableRow>
  );
};

const VirtualServiceDetails: React.FC<VirtualServiceDetailsProps> = ({ obj: virtualservice }) => {
  const { t } = useTranslation();
  return <>
    <div className="co-m-pane__body">
      <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_36')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={virtualservice} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>
};

const { details, editYaml } = navFactory;
export const VirtualServices: React.FC = props =>{
  const { t } = useTranslation();
  return <Table {...props} aria-label="Virtual Services" Header={VirtualServiceTableHeader.bind(null, t)} Row={VirtualServiceTableRow} virtualize />;
};

export const VirtualServicesPage: React.FC<VirtualServicesPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_36')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_36') })} canCreate={true} ListComponent={VirtualServices} kind={kind} {...props} />;
};

export const VirtualServicesDetailsPage: React.FC<VirtualServicesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(VirtualServiceDetails)), editYaml()]} />;

type VirtualServiceDetailsProps = {
  obj: K8sResourceKind;
};

type VirtualServicesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type VirtualServicesDetailsPageProps = {
  match: any;
};