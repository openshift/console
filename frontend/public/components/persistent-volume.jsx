import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';

import { Status } from '@console/shared';
import { DetailsPage, ListPage, VirtualTable, VirtualTableRow, VirtualTableData } from './factory';
import { Kebab, LabelList, navFactory, ResourceKebab, SectionHeading, ResourceLink, ResourceSummary, Timestamp } from './utils';

const { common } = Kebab.factory;
const menuActions = [...common];

const PVStatus = ({pv}) => <Status status={pv.status.phase} />;

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const PVTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status', sortField: 'status.phase', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Claim', sortField: 'spec.claimRef.name', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Capacity', sortField: 'spec.capacity.storage', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Labels', sortField: 'metadata.labels', transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Created', sortField: 'metadata.creationTimestamp', transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '', props: { className: tableColumnClasses[6] },
    },
  ];
};
PVTableHeader.displayName = 'PVTableHeader';

const kind = 'PersistentVolume';

const PVTableRow = ({obj, index, key, style}) => {
  return (
    <VirtualTableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <VirtualTableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[1]}>
        <PVStatus pv={obj} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[2]}>
        {_.get(obj,'spec.claimRef.name') ?
          <ResourceLink kind="PersistentVolumeClaim" name={obj.spec.claimRef.name} namespace={obj.spec.claimRef.namespace} title={obj.spec.claimRef.name} />
          :
          <div className="text-muted">No Claim</div>
        }
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[3]}>
        {_.get(obj, 'spec.capacity.storage', '-')}
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[4]}>
        <LabelList kind={kind} labels={obj.metadata.labels} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </VirtualTableData>
    </VirtualTableRow>
  );
};
PVTableRow.displayName = 'PVTableRow';

const Details = ({obj}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="PersistentVolume Overview" />
    <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} showPodSelector />
  </div>
</React.Fragment>;

export const PersistentVolumesList = props => <VirtualTable {...props} aria-label="Persistent Volumes" Header={PVTableHeader} Row={PVTableRow} />;
export const PersistentVolumesPage = props => <ListPage {...props} ListComponent={PersistentVolumesList} kind={kind} canCreate={true} />;
export const PersistentVolumesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
