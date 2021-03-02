import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, LabelList, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceIcon, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { FederatedDaemonSetModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(FederatedDaemonSetModel), ...Kebab.factory.common];

const kind = FederatedDaemonSetModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const FederatedDaemonSetTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortFunc: 'daemonsetPhase',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_15'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Annotations',
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
FederatedDaemonSetTableHeader.displayName = 'FederatedDaemonSetTableHeader';

const FederatedDaemonSetTableRow: RowFunction<K8sResourceKind> = ({ obj: daemonset, index, key, style }) => {
  const { t } = useTranslation();
  return (
    <TableRow id={daemonset.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={daemonset.metadata.name} namespace={daemonset.metadata.namespace} title={daemonset.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={daemonset.status.phase} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <LabelList kind={kind} labels={daemonset.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {t('MSG_DETAILS_TABDETAILS_DETAILS_100', { 0: _.size(daemonset.metadata.annotations) })}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={daemonset.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={daemonset} />
      </TableData>
    </TableRow>
  );
};

export const ClusterRow: React.FC<ClusterRowProps> = ({ daemonset }) => {
  return (
    <div className="row">
      <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
        <ResourceIcon kind={kind} />
        {daemonset.metadata.name}
      </div>
      <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7">
        <ResourceLink kind="Cluster" name={daemonset.spec.placement.clusters[0].name} />
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
        <Status status={daemonset.status.phase} />
      </div>
      <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
        <Timestamp timestamp={daemonset.metadata.creationTimestamp} />
      </div>
    </div>
  );
};

export const DaemonSetDistributionTable: React.FC<DaemonSetDistributionTableProps> = ({
  heading,
  daemonset
}) => {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeading text={heading} />
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">{t('COMMON:MSG_DETAILS_TABOVERVIEW_TABLEHEADER_1')}</div>
          <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7">{t('COMMON:MSG_DETAILS_TABOVERVIEW_TABLEHEADER_2')}</div>
          <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">Result</div>
          <div className="col-lg-1 col-md-2 hidden-sm hidden-xs">{t('COMMON:MSG_DETAILS_TABOVERVIEW_TABLEHEADER_3')}</div>
        </div>
        <div className="co-m-table-grid__body">
          {/*containers.map((c: any, i: number) => (
          <ClusterRow key={i} daemonset={daemonset} container={c} />
        ))*/}
          <ClusterRow daemonset={daemonset} />
        </div>
      </div>
    </>
  );}

const FederatedDaemonSetDetails: React.FC<FederatedDaemonSetDetailsProps> = ({ obj: daemonset }) => {
  const { t } = useTranslation();
  return (
  <>
    <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_MAIN_DIV1_3', { 0: t('COMMON:MSG_LNB_MENU_30') })} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={daemonset} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <DaemonSetDistributionTable
        key="distributionTable"
        heading="Distribution"
        daemonset={daemonset} />
    </div>
  </>
);}

const { details, editYaml } = navFactory;
export const FederatedDaemonSets: React.FC = props => <Table {...props} aria-label="Federated Daemon Sets" Header={FederatedDaemonSetTableHeader} Row={FederatedDaemonSetTableRow} virtualize />;

export const FederatedDaemonSetsPage: React.FC<FederatedDaemonSetsPageProps> = props => <ListPage canCreate={true} ListComponent={FederatedDaemonSets} kind={kind} {...props} />;

export const FederatedDaemonSetsDetailsPage: React.FC<FederatedDaemonSetsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(FederatedDaemonSetDetails)), editYaml()]} />;

type ClusterRowProps = {
  daemonset: K8sResourceKind;
}

type DaemonSetDistributionTableProps = {
  daemonset: K8sResourceKind;
  heading: string;
};

type FederatedDaemonSetDetailsProps = {
  obj: K8sResourceKind;
};

type FederatedDaemonSetsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type FederatedDaemonSetsDetailsPageProps = {
  match: any;
};
