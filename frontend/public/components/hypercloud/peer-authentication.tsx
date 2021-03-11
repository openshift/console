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
import { PeerAuthenticationModel } from '../../models';
import { ResourceLabel } from '../../models/hypercloud/resource-plural';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(PeerAuthenticationModel), ...Kebab.factory.common];

const kind = PeerAuthenticationModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const PeerAuthenticationTableHeader = (t?: TFunction) => {
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
PeerAuthenticationTableHeader.displayName = 'PeerAuthenticationTableHeader';

const PeerAuthenticationTableRow: RowFunction<K8sResourceKind> = ({ obj: peerauthentication, index, key, style }) => {
  return (
    <TableRow id={peerauthentication.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={peerauthentication.metadata.name} namespace={peerauthentication.metadata.namespace} title={peerauthentication.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={peerauthentication.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={peerauthentication.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={peerauthentication} />
      </TableData>
    </TableRow>
  );
};

const PeerAuthenticationDetails: React.FC<PeerAuthenticationDetailsProps> = ({ obj: peerauthentication }) => {
  const { t } = useTranslation();
  return <>
    <div className="co-m-pane__body">
      <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', {0: ResourceLabel(peerauthentication, t)})} />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={peerauthentication} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>;
};

const { details, editYaml } = navFactory;
export const PeerAuthentications: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Peer Authentications" Header={PeerAuthenticationTableHeader.bind(null, t)} Row={PeerAuthenticationTableRow} virtualize />;
};

export const PeerAuthenticationsPage: React.FC<PeerAuthenticationsPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_43')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_43') })} canCreate={true} ListComponent={PeerAuthentications} kind={kind} {...props} />;
};

export const PeerAuthenticationsDetailsPage: React.FC<PeerAuthenticationsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(PeerAuthenticationDetails)), editYaml()]} />;

type PeerAuthenticationDetailsProps = {
  obj: K8sResourceKind;
};

type PeerAuthenticationsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type PeerAuthenticationsDetailsPageProps = {
  match: any;
};