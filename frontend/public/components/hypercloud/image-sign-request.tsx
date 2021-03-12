import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ImageSignRequestModel } from '../../models';
import { Status } from '@console/shared';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ResourceLabel } from '../../models/hypercloud/resource-plural';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ImageSignRequestModel), ...Kebab.factory.common];

const kind = ImageSignRequestModel.kind;

const tableColumnClasses = ['', '', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const ImageSignRequestTableHeader = (t?: TFunction) => {
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
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortField: 'status.imageSignResponse.result',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_38'),
      sortField: 'spec.image',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_74'),
      sortField: 'spec.signer',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
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

export const ImageSignRequestDetailsList: React.FC<ImageSignRequestDetailsListProps> = ({ ds }) => {
  const { t } = useTranslation();
  return (
    <dl className="co-m-pane__details">
      <dt>{`${t('SINGLE:MSG_JOBS_JOBDETAILS_TABDETAILS_JOBSTATUS_2')}`}</dt>
      <dd>
        <ImageSignRequestStatus result={ds.status.imageSignResponse.result} />
      </dd>
      <DetailsItem label={`${t('COMMON:MSG_DETAILS_TABDETAILS_CONTAINERS_TABLEHEADER_3')}`} obj={ds} path="spec.image" />
      <DetailsItem label={`${t('COMMON:MSG_DETAILS_TABDETAILS_SIGNERS_1')}`} obj={ds} path="spec.signer" />
    </dl>
  );
}

const ImageSignRequestDetails: React.FC<ImageSignRequestDetailsProps> = ({ obj: signrequest }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: ResourceLabel(signrequest, t) })} />
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
}

const { details, editYaml } = navFactory;

export const ImageSignRequests: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="ImageSignRequests" Header={ImageSignRequestTableHeader.bind(null, t)} Row={ImageSignRequestTableRow} virtualize />;
};

export const ImageSignRequestsPage: React.FC<ImageSignRequestsPageProps> = props => {
  const { t } = useTranslation();

  return <ListPage
    title={t('COMMON:MSG_LNB_MENU_92')}
    createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_92') })}
    canCreate={true}
    ListComponent={ImageSignRequests}
    kind={kind}
    {...props}
  />;
}

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
