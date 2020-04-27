import './_volume-snapshot.scss';

import * as React from 'react';
import * as classNames from 'classnames';

import {
  DetailsPage,
  ListPage,
  Table,
  TableData,
  TableProps,
  TableRow,
  RowFunction,
} from '@console/internal/components/factory';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import {
  Kebab,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
  PageComponentProps,
  Timestamp,
} from '@console/internal/components/utils';
import { getName, getNamespace, Status } from '@console/shared';

import { PersistentVolumeClaimModel } from '@console/internal/models';
import { VolumeSnapshotModel } from '../../models';
import { getKebabActionsForKind } from '../../utils/kebab-actions';
import { sortable } from '@patternfly/react-table';
import { volumeSnapshotModal } from '../modals/volume-snapshot-modal/volume-snapshot-modal';

export const snapshotMenuActions = [...getKebabActionsForKind(VolumeSnapshotModel)];

const snapshotTableColumnClasses = [
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

export const VolumeSnapshotTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[0] },
    },
    {
      title: 'Date',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[1] },
    },
    {
      title: 'Status',
      sortField: 'status.readyToUse',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[2] },
    },
    {
      title: 'Size',
      sortField: 'status.restoreSize',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: snapshotTableColumnClasses[4] },
    },
  ];
};
VolumeSnapshotTableHeader.displayName = 'SnapshotTableHeader';

const volumeSnapshotKind = referenceFor(VolumeSnapshotModel);

const breadcrumbsForSnapshotDetailsPage = (match: any) => () => [
  {
    name: PersistentVolumeClaimModel.labelPlural,
    path: `/k8s/ns/${match.params.ns}/persistentvolumeclaims`,
  },
  {
    name: 'Snapshot Details',
    path: `${match.url}`,
  },
];

export const DetailsComponent = ({ obj: volumeSnapshot }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Volume Snapshot Details" />
      <div className="row">
        <div className="col-md-6">
          <ResourceSummary resource={volumeSnapshot}>
            <dt>Status</dt>
            <dd>{volumeSnapshot.status.readyToUse ? 'Ready' : 'Not Ready'}</dd>
            <dt>Size</dt>
            <dd>{volumeSnapshot.status.restoreSize || 'No Data'}</dd>
          </ResourceSummary>
        </div>
        <div className="col-md-6">
          <dt>Persistent Volume Claim</dt>
          <dd>
            <ResourceLink
              kind={PersistentVolumeClaimModel.kind}
              name={volumeSnapshot.spec.source.persistentVolumeClaimName}
              namespace={getNamespace(volumeSnapshot)}
            />
          </dd>
        </div>
      </div>
    </div>
  </>
);

export const VolumeSnapshotDetails = (props) => (
  <DetailsPage
    {...props}
    menuActions={snapshotMenuActions}
    kind={referenceFor(VolumeSnapshotModel)}
    name={props.match.params.name}
    kindObj={VolumeSnapshotModel}
    namespace={props.match.params.ns}
    pages={[navFactory.details(DetailsComponent)]}
    breadcrumbsFor={breadcrumbsForSnapshotDetailsPage(props.match)}
  />
);

export const VolumeSnapshotTableRow: RowFunction<K8sResourceKind> = ({
  obj,
  index,
  key,
  style,
}) => (
  <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
    <TableData className={snapshotTableColumnClasses[0]}>
      <ResourceLink
        kind={referenceFor(VolumeSnapshotModel)}
        name={getName(obj)}
        namespace={getNamespace(obj)}
        title={getName(obj)}
      />
    </TableData>
    <TableData className={snapshotTableColumnClasses[1]}>
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
    </TableData>
    <TableData className={snapshotTableColumnClasses[2]}>
      <Status status={obj.status.readyToUse ? 'Ready' : 'Not Ready'} />
    </TableData>
    <TableData className={snapshotTableColumnClasses[3]}>{obj.status.restoreSize || '-'}</TableData>
    <TableData className={snapshotTableColumnClasses[4]}>
      <ResourceKebab actions={snapshotMenuActions} kind={volumeSnapshotKind} resource={obj} />
    </TableData>
  </TableRow>
);

export const VolumeSnapshotList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label="Volume Snapshot List"
    Header={VolumeSnapshotTableHeader}
    Row={VolumeSnapshotTableRow}
    virtualize
  />
);

export const VolumeSnapshotPage: React.FC<PageComponentProps> = ({ obj }) => (
  <ListPage
    canCreate
    kind={volumeSnapshotKind}
    ListComponent={VolumeSnapshotList}
    showTitle={false}
    namespace={obj.metadata.namespace}
    createHandler={() => volumeSnapshotModal({ resource: obj })}
  />
);
