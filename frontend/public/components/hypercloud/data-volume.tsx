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
import { DataVolumeModel } from '../../models';

export const menuActions: KebabAction[] = [...Kebab.getExtensionsActionsForKind(DataVolumeModel), ...Kebab.factory.common];

const kind = DataVolumeModel.kind;

const tableColumnClasses = ['', '', classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), Kebab.columnClass];

const DataVolumeTableHeader = (t?: TFunction) => {
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
DataVolumeTableHeader.displayName = 'DataVolumeTableHeader';

const DataVolumeTableRow: RowFunction<K8sResourceKind> = ({ obj: datavolume, index, key, style }) => {
  return (
    <TableRow id={datavolume.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={datavolume.metadata.name} namespace={datavolume.metadata.namespace} title={datavolume.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={datavolume.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={datavolume.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={datavolume} />
      </TableData>
    </TableRow>
  );
};

const DataVolumeDetails: React.FC<DataVolumeDetailsProps> = ({ obj: datavolume }) => {
  const { t } = useTranslation();
  return <>
    <div className="co-m-pane__body">
      <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_54')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={datavolume} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
    </div>
  </>;
};

const { details, editYaml } = navFactory;
export const DataVolumes: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Data Volumes" Header={DataVolumeTableHeader.bind(null, t)} Row={DataVolumeTableRow} virtualize />;
};

export const DataVolumesPage: React.FC<DataVolumesPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_54')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_54') })} canCreate={true} ListComponent={DataVolumes} kind={kind} {...props} />;
};

export const DataVolumesDetailsPage: React.FC<DataVolumesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={menuActions} pages={[details(detailsPage(DataVolumeDetails)), editYaml()]} />;

type DataVolumeDetailsProps = {
  obj: K8sResourceKind;
};

type DataVolumesPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type DataVolumesDetailsPageProps = {
  match: any;
};