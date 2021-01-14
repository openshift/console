import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ImageScanRequestModel } from '../../models';
import { Status } from '@console/shared';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ImageScanRequestModel), ...Kebab.factory.common];

const kind = ImageScanRequestModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const ImageScanRequestTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Status',
      sortField: 'status.status',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Image',
      sortField: 'spec.imageUrl',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Created',
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

ImageScanRequestTableHeader.displayName = 'ImageScanRequestTableHeader';

const ImageScanRequestTableRow: RowFunction<K8sResourceKind> = ({ obj: scanrequest, index, key, style }) => {
  return (
    <TableRow id={scanrequest.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={scanrequest.metadata.name} namespace={scanrequest.metadata.namespace} title={scanrequest.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={scanrequest.metadata.namespace} title={scanrequest.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={scanrequest?.status?.status} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Status status={scanrequest?.spec?.imageUrl} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={scanrequest.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={scanrequest} />
      </TableData>
    </TableRow>
  );
};

export const ImageScanRequestStatus: React.FC<ImageScanRequestStatusStatusProps> = ({ result }) => <Status status={result} />;

export const ImageScanRequestDetailsList: React.FC<ImageScanRequestDetailsListProps> = ({ ds }) => {
  const summaries = [];
  for (const key in ds.status.summary) {
    summaries.push({ key: key, value: ds.status.summary[key] });
  }
  return (
    <dl className="co-m-pane__details">
      <dt>Status</dt>
      <dd>
        <ImageScanRequestStatus result={ds?.status?.status} />
      </dd>
      <DetailsItem label="Image" obj={ds} path="spec.imageUrl" />
      <dt>Summary</dt>
      {summaries.map(summary => {
        return <dd key={summary.key}> {`${summary.key} ${summary.value}`}</dd>;
      })}
      {/* <DetailsItem label="Summary" obj={ds} path="status.summary" /> */}
    </dl>
  );
};

const ImageScanRequestDetails: React.FC<ImageScanRequestDetailsProps> = ({ obj: scanrequest }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Image Sign Request Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={scanrequest} />
        </div>
        <div className="col-lg-6">
          <ImageScanRequestDetailsList ds={scanrequest} />
        </div>
      </div>
    </div>
  </>
);

const { details, editYaml } = navFactory;

export const ImageScanRequests: React.FC = props => <Table {...props} aria-label="ImageScanRequests" Header={ImageScanRequestTableHeader} Row={ImageScanRequestTableRow} virtualize />;

export const ImageScanRequestsPage: React.FC<ImageScanRequestsPageProps> = props => <ListPage canCreate={true} ListComponent={ImageScanRequests} kind={kind} {...props} />;

export const ImageScanRequestsDetailsPage: React.FC<ImageScanRequestsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(ImageScanRequestDetails)), editYaml()]} />;

type ImageScanRequestDetailsListProps = {
  ds: K8sResourceKind;
};

type ImageScanRequestsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type ImageScanRequestDetailsProps = {
  obj: K8sResourceKind;
};

type ImageScanRequestsDetailsPageProps = {
  match: any;
};
type ImageScanRequestStatusStatusProps = {
  result: string;
};
