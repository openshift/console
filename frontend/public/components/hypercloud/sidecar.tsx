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
import { SidecarModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(SidecarModel), ...Kebab.factory.common];

const kind = SidecarModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const SidecarTableHeader = (t?: TFunction) => {
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
SidecarTableHeader.displayName = 'SidecarTableHeader';

const SidecarTableRow: RowFunction<K8sResourceKind> = ({ obj: sidecar, index, key, style }) => {
  return (
    <TableRow id={sidecar.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={sidecar.metadata.name} namespace={sidecar.metadata.namespace} title={sidecar.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={sidecar.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={sidecar.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={sidecar} />
      </TableData>
    </TableRow>
  );
};

const SidecarDetails: React.FC<SidecarDetailsProps> = ({ obj: sidecar }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Sidecar Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={sidecar} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>
);

const { details, editYaml } = navFactory;
export const Sidecars: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Sidecars" Header={SidecarTableHeader.bind(null, t)} Row={SidecarTableRow} virtualize />;
};

export const SidecarsPage: React.FC<SidecarsPageProps> = props => <ListPage canCreate={true} ListComponent={Sidecars} kind={kind} {...props} />;

export const SidecarsDetailsPage: React.FC<SidecarsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(SidecarDetails)), editYaml()]} />;

type SidecarDetailsProps = {
  obj: K8sResourceKind;
};

type SidecarsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type SidecarsDetailsPageProps = {
  match: any;
};