import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { PipelineResourceModel } from '../../models';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(PipelineResourceModel), ...Kebab.factory.common];

const kind = PipelineResourceModel.kind;

const tableColumnClasses = [
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];


const PipelineResourceTableHeader = (t?: TFunction) => {
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

PipelineResourceTableHeader.displayName = 'PipelineResourceTableHeader';


const PipelineResourceTableRow: RowFunction<K8sResourceKind> = ({ obj: pipelineResource, index, key, style }) => {
  return (
    <TableRow id={pipelineResource.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={pipelineResource.metadata.name} namespace={pipelineResource.metadata.namespace} title={pipelineResource.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={pipelineResource.metadata.namespace} title={pipelineResource.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={pipelineResource.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={pipelineResource} />
      </TableData>
    </TableRow>
  );
};

const PipelineResourceDetails: React.FC<PipelineResourceDetailsProps> = ({ obj: pipelineResource }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Pipeline Resource Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={pipelineResource} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
    </div>
  </>
);


const { details, editYaml } = navFactory;

export const PipelineResources: React.FC = props => {
  const { t } = useTranslation();

  return <Table {...props} aria-label="Pipeline Resources" Header={PipelineResourceTableHeader.bind(null, t)} Row={PipelineResourceTableRow} virtualize />;
}


export const PipelineResourcesPage: React.FC<PipelineResourcesPageProps> = props => {
  const { t } = useTranslation();

  return <ListPage
    title={t('COMMON:MSG_LNB_MENU_62')}
    createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_62') })}
    canCreate={true}
    ListComponent={PipelineResources}
    kind={kind}
    {...props}
  />;
}

export const PipelineResourcesDetailsPage: React.FC<PipelineResourcesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(PipelineResourceDetails)), editYaml()]} />;

type PipelineResourcesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type PipelineResourceDetailsProps = {
  obj: K8sResourceKind;
};

type PipelineResourcesDetailsPageProps = {
  match: any;
};