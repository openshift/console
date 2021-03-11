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
import { GatewayModel } from '../../models';
import { ResourceLabel } from '../../models/hypercloud/resource-plural';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(GatewayModel), ...Kebab.factory.common];

const kind = GatewayModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const GatewayTableHeader = (t?: TFunction) => {
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
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
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
GatewayTableHeader.displayName = 'GatewayTableHeader';

const GatewayTableRow: RowFunction<K8sResourceKind> = ({ obj: gateway, index, key, style }) => {
  return (
    <TableRow id={gateway.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={gateway.metadata.name} namespace={gateway.metadata.namespace} title={gateway.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={gateway.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={gateway.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={gateway} />
      </TableData>
    </TableRow>
  );
};

const GatewayDetails: React.FC<GatewayDetailsProps> = ({ obj: gateway }) => {
  const { t } = useTranslation();
  return <>
    <div className="co-m-pane__body">
    <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', {0: ResourceLabel(gateway, t)})} />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={gateway} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>;
};

const { details, editYaml } = navFactory;
export const Gateways: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Gateways" Header={GatewayTableHeader.bind(null, t)} Row={GatewayTableRow} virtualize />;
};

export const GatewaysPage: React.FC<GatewaysPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_39')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_39') })} canCreate={true} ListComponent={Gateways} kind={kind} {...props} />;
};

export const GatewaysDetailsPage: React.FC<GatewaysDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(GatewayDetails)), editYaml()]} />;

type GatewayDetailsProps = {
  obj: K8sResourceKind;
};

type GatewaysPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type GatewaysDetailsPageProps = {
  match: any;
};