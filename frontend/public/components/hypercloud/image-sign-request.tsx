import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ImageSignRequestModel } from '../../models';
import { Status } from '@console/shared';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ImageSignRequestModel), ...Kebab.factory.common];

const kind = ImageSignRequestModel.kind;

const tableColumnClasses = ['', '', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const ImageSignRequestTableHeader = () => {
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
      sortField: 'status.imageSignResponse.result',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Image',
      sortField: 'spec.image',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Signer',
      sortField: 'spec.signer',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};

ImageSignRequestTableHeader.displayName = 'ImageSignRequestTableHeader';

const ImageSignRequestTableRow: RowFunction<K8sResourceKind> = ({ obj: signrequest, index, key, style }) => {
  return (
    <TableRow id={signrequest.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={signrequest.metadata.name} namespace={signrequest.metadata.namespace} title={signrequest.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={signrequest.metadata.namespace} title={signrequest.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={signrequest?.status?.imageSignResponse?.result} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{signrequest?.spec?.image}</TableData>
      <TableData className={tableColumnClasses[4]}>{signrequest?.spec?.signer}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={signrequest.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={signrequest} />
      </TableData>
    </TableRow>
  );
};

export const ImageSignRequestStatus: React.FC<ImageSignRequestStatusStatusProps> = ({ result }) => <Status status={result} />;

export const ImageSignRequestDetailsList: React.FC<ImageSignRequestDetailsListProps> = ({ ds }) => (
  <dl className="co-m-pane__details">
    <dt>Status</dt>
    <dd>
      <ImageSignRequestStatus result={ds.status.imageSignResponse.result} />
    </dd>
    <DetailsItem label="Image" obj={ds} path="spec.image" />
    <DetailsItem label="Signer" obj={ds} path="spec.signer" />
  </dl>
);

const ImageSignRequestDetails: React.FC<ImageSignRequestDetailsProps> = ({ obj: signrequest }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Image Sign Request Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={signrequest} />
        </div>
        <div className="col-lg-6">
          <ImageSignRequestDetailsList ds={signrequest} />
        </div>
      </div>
    </div>
  </>
);

const { details, editYaml } = navFactory;

export const ImageSignRequests: React.FC = props => <Table {...props} aria-label="ImageSignRequests" Header={ImageSignRequestTableHeader} Row={ImageSignRequestTableRow} virtualize />;

export const ImageSignRequestsPage: React.FC<ImageSignRequestsPageProps> = props => <ListPage canCreate={true} ListComponent={ImageSignRequests} kind={kind} {...props} />;

export const ImageSignRequestsDetailsPage: React.FC<ImageSignRequestsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(ImageSignRequestDetails)), editYaml()]} />;

type ImageSignRequestDetailsListProps = {
  ds: K8sResourceKind;
};

type ImageSignRequestsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type ImageSignRequestDetailsProps = {
  obj: K8sResourceKind;
};

type ImageSignRequestsDetailsPageProps = {
  match: any;
};
type ImageSignRequestStatusStatusProps = {
  result: string;
};
