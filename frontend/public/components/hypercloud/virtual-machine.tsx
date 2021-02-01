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
import { VirtualMachineModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(VirtualMachineModel), ...Kebab.factory.common];

const kind = VirtualMachineModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const VirtualMachineTableHeader = (t?: TFunction) => {
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
VirtualMachineTableHeader.displayName = 'VirtualMachineTableHeader';

const VirtualMachineTableRow: RowFunction<K8sResourceKind> = ({ obj: virtualmachine, index, key, style }) => {
  return (
    <TableRow id={virtualmachine.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={virtualmachine.metadata.name} namespace={virtualmachine.metadata.namespace} title={virtualmachine.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={virtualmachine.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={virtualmachine.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={virtualmachine} />
      </TableData>
    </TableRow>
  );
};

const VirtualMachineDetails: React.FC<VirtualMachineDetailsProps> = ({ obj: virtualmachine }) => {
  const { t } = useTranslation();
  return <>
    <div className="co-m-pane__body">
      <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_33')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={virtualmachine} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>;
};

const { details, editYaml } = navFactory;
export const VirtualMachines: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Virtual Machines" Header={VirtualMachineTableHeader.bind(null, t)} Row={VirtualMachineTableRow} virtualize />;
};

export const VirtualMachinesPage: React.FC<VirtualMachinesPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_33')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_33') })} canCreate={true} ListComponent={VirtualMachines} kind={kind} {...props} />;
};

export const VirtualMachinesDetailsPage: React.FC<VirtualMachinesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(VirtualMachineDetails)), editYaml()]} />;

type VirtualMachineDetailsProps = {
  obj: K8sResourceKind;
};

type VirtualMachinesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type VirtualMachinesDetailsPageProps = {
  match: any;
};