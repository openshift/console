import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { IntegrationJobModel } from '../../models/hypercloud';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ResourceLabel } from '../../models/hypercloud/resource-plural';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(IntegrationJobModel), ...Kebab.factory.common];

const kind = IntegrationJobModel.kind;

const tableColumnClasses = [
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

const IntegrationJobTableHeader = (t?: TFunction) => {
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

IntegrationJobTableHeader.displayName = 'IntegrationJobTableHeader';


const IntegrationJobTableRow: RowFunction<K8sResourceKind> = ({ obj: integrationJob, index, key, style }) => {
  return (
    <TableRow id={integrationJob.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={integrationJob.metadata.name} namespace={integrationJob.metadata.namespace} title={integrationJob.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={integrationJob.metadata.namespace} title={integrationJob.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={integrationJob.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={integrationJob} />
      </TableData>
    </TableRow>
  );
};

const IntegrationJobDetails: React.FC<IntegrationJobDetailsProps> = ({ obj: integrationJob }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: ResourceLabel(integrationJob, t) })} />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={integrationJob} />
          </div>
        </div>
      </div>
    </>
  );
}

const { details, editYaml } = navFactory;

export const IntegrationJobs: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="IntegrationJobs" Header={IntegrationJobTableHeader.bind(null, t)} Row={IntegrationJobTableRow} virtualize />;
}


export const IntegrationJobsPage: React.FC<IntegrationJobsPageProps> = props => {
  const { t } = useTranslation();

  return <ListPage
    title={t('SINGLE:MSG_CI/CD_MAILFORM_REQUEST_7')}
    canCreate={false}
    ListComponent={IntegrationJobs}
    kind={kind}
    {...props}
  />;
}

export const IntegrationJobsDetailsPage: React.FC<IntegrationJobsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(IntegrationJobDetails)), editYaml()]} />;

type IntegrationJobsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type IntegrationJobDetailsProps = {
  obj: K8sResourceKind;
};

type IntegrationJobsDetailsPageProps = {
  match: any;
};