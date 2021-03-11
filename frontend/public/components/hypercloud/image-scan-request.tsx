import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ImageScanRequestModel } from '../../models';
import { Status } from '@console/shared';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ImageScanRequestModel), ...Kebab.factory.common];

const kind = ImageScanRequestModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), classNames('pf-m-hidden', 'pf-m-visible-on-lg'), Kebab.columnClass];

const ImageScanRequestTableHeader = (t?: TFunction) => {
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
      sortField: 'status.status',
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
        <Timestamp timestamp={scanrequest.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={scanrequest} />
      </TableData>
    </TableRow>
  );
};

export const ImageScanRequestStatus: React.FC<ImageScanRequestStatusStatusProps> = ({ result }) => <Status status={result} />;

export const ImageScanRequestDetailsList: React.FC<ImageScanRequestDetailsListProps> = ({ ds }) => {
  const { t } = useTranslation();

  return (
    <dl className="co-m-pane__details">
      <dt>{t('COMMON:MSG_MAIN_TABLEHEADER_3')}</dt>
      <dd>
        <ImageScanRequestStatus result={ds?.status?.status} />
      </dd>
      {/* <dt>Summary</dt>
      {summaries.map(summary => {
        let summaryDisplay = summary.map(status => {
          return <li key={status.key}> {`${status.key} ${status.value}`}</li>;
        });
        return (
          <>
            <dd>
              {summaryKey.shift()}
              <ul>{summaryDisplay}</ul>
            </dd>
          </>
        );
      })} */}
      {/* <DetailsItem label="Summary" obj={ds} path="status.summary" /> */}
    </dl>
  );
};
export const ScanResultRow: React.FC<ScanResultRowProps> = ({ scanList }) => {
  return (
    <div className="row">
      <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">{scanList?.image}</div>
      <div className="col-lg-6 col-md-6 col-sm-6 hidden-xs">{scanList?.summary}</div>
    </div>
  );
};
export const ScanResultTable: React.FC<ScanResultTableProps> = ({ heading, scanList }) => {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeading text={heading} />
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">{`${t('COMMON:MSG_DETAILS_CONTAINER_IMAGEDETAILS_1')}`}</div>
          <div className="col-lg-6 col-md-6 col-sm-6 col-xs-6">{`${t('COMMON:MSG_DETAILS_TABDETAILS_21')}`}</div>
        </div>
        <div className="co-m-table-grid__body">
          {scanList.map((c: any, i: number) => (
            <ScanResultRow key={i} scanList={c} />
          ))}
        </div>
      </div>
    </>
  );
}

const ImageScanRequestDetails: React.FC<ImageScanRequestDetailsProps> = ({ obj: scanrequest }) => {
  const { t } = useTranslation();
  const summaries = [];
  for (const key in scanrequest.status?.results) {
    let summary = { image: '', summary: '' };
    summary.image = key;
    for (const statusKey in scanrequest.status.results[key].summary) {
      summary.summary += `${statusKey} ${scanrequest.status.results[key].summary[statusKey]}, `;
    }
    summary.summary = summary.summary.substr(0, summary.summary.length - 2);
    summaries.push(summary);
  }

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_95')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={scanrequest} />
          </div>
          <div className="col-lg-6">
            <ImageScanRequestDetailsList ds={scanrequest} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <ScanResultTable heading="Scan Result" scanList={summaries} />
      </div>
    </>
  );
};

const { details, editYaml } = navFactory;

export const ImageScanRequests: React.FC = props => {
  const { t } = useTranslation();

  return <Table
    {...props}
    aria-label="ImageScanRequests"
    Header={ImageScanRequestTableHeader.bind(null, t)}
    Row={ImageScanRequestTableRow}
    virtualize
  />;
}

export const ImageScanRequestsPage: React.FC<ImageScanRequestsPageProps> = props => {
  const { t } = useTranslation();

  return <ListPage
    title={t('COMMON:MSG_LNB_MENU_95')}
    createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_95') })}
    canCreate={true}
    ListComponent={ImageScanRequests}
    kind={kind}
    {...props}
  />;
}

export const ImageScanRequestsDetailsPage: React.FC<ImageScanRequestsDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(ImageScanRequestDetails)), editYaml()]} />;

type ImageScanRequestDetailsListProps = {
  ds: K8sResourceKind;
};

type ScanResultTableProps = {
  heading: string;
  scanList: any;
};

type ScanResultRowProps = {
  scanList: any;
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
