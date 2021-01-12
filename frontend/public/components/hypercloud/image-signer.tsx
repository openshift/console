import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { DetailsItem, Kebab, KebabAction, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ImageSignerModel } from '../../models';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(ImageSignerModel), ...Kebab.factory.common];

const kind = ImageSignerModel.kind;

const tableColumnClasses = [
    classNames('col-xs-6', 'col-sm-4'),
    classNames('col-xs-6', 'col-sm-4'),
    classNames('col-sm-4', 'hidden-xs'),
    Kebab.columnClass,
  ];


const ImageSignerTableHeader = (t?: TFunction) => {
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

  ImageSignerTableHeader.displayName = 'ImageSignerTableHeader';

  
const ImageSignerTableRow: RowFunction<K8sResourceKind> = ({ obj: imageSigner, index, key, style }) => {
    return (
      <TableRow id={imageSigner.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={imageSigner.metadata.name} namespace={imageSigner.metadata.namespace} title={imageSigner.metadata.uid} />
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
            <ResourceLink kind="Namespace" name={imageSigner.metadata.namespace} title={imageSigner.metadata.namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <Timestamp timestamp={imageSigner.metadata.creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={imageSigner} />
      </TableData>
      </TableRow>
    );
  };

  export const ImageSignerDetailsList: React.FC<ImageSignerDetailsListProps> = ({ ds }) => (
    <dl className="co-m-pane__details">
      <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
      <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
    </dl>
  );

  
const ImageSignerDetails: React.FC<ImageSignerDetailsProps> = ({ obj: imageSigner }) => (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Image Signer Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={imageSigner} showPodSelector showNodeSelector showTolerations />
          </div>
          <div className="col-lg-6">
            <ImageSignerDetailsList ds={imageSigner} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
      </div>
    </>
  );

  
const { details, editYaml } = navFactory;

export const ImageSigners: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="ImageSigners" Header={ImageSignerTableHeader.bind(null, t)} Row={ImageSignerTableRow} virtualize />
};


export const ImageSignersPage: React.FC<ImageSignersPageProps> = props => <ListPage canCreate={true} ListComponent={ImageSigners} kind={kind} {...props} />;

export const ImageSignersDetailsPage: React.FC<ImageSignersDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(ImageSignerDetails)), editYaml()]} />;


  type ImageSignerDetailsListProps = {
    ds: K8sResourceKind;
  };

  type ImageSignersPageProps = {
    showTitle?: boolean;
    namespace?: string;
    selector?: any;
  };

  type ImageSignerDetailsProps = {
    obj: K8sResourceKind;
  };

  type ImageSignersDetailsPageProps = {
    match: any;
  };