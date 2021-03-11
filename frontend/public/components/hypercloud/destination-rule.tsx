import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next'

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { Status } from '@console/shared';
import { DestinationRuleModel } from '../../models';
import { ResourceLabel } from '../../models/hypercloud/resource-plural';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(DestinationRuleModel), ...Kebab.factory.common];

const kind = DestinationRuleModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const DestinationRuleTableHeader = (t?: TFunction) => {
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
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};
DestinationRuleTableHeader.displayName = 'DestinationRuleTableHeader';

const DestinationRuleTableRow: RowFunction<K8sResourceKind> = ({ obj: destinationrule, index, key, style }) => {
  return (
    <TableRow id={destinationrule.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={destinationrule.metadata.name} namespace={destinationrule.metadata.namespace} title={destinationrule.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={destinationrule.metadata.namespace} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        {destinationrule.spec.host}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={destinationrule.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={destinationrule} />
      </TableData>
    </TableRow>
  );
};

const DestinationRuleDetails: React.FC<DestinationRuleDetailsProps> = ({ obj: destinationrule }) => {
  const { t } = useTranslation();
  return <>
    <div className="co-m-pane__body">
    <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', {0: ResourceLabel(destinationrule, t)})} />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={destinationrule} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>;
};

const { details, editYaml } = navFactory;
export const DestinationRules: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Destination Rules" Header={DestinationRuleTableHeader.bind(null, t)} Row={DestinationRuleTableRow} virtualize />;
};

export const DestinationRulesPage: React.FC<DestinationRulesPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_37')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_37') })} canCreate={true} ListComponent={DestinationRules} kind={kind} {...props} />;
};

export const DestinationRulesDetailsPage: React.FC<DestinationRulesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(DestinationRuleDetails)), editYaml()]} />;

type DestinationRuleDetailsProps = {
  obj: K8sResourceKind;
};

type DestinationRulesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type DestinationRulesDetailsPageProps = {
  match: any;
};