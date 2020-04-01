import './_volume-snapshot.scss';

import * as React from 'react';
import * as classNames from 'classnames';

import {
  DetailsPage,
  Table,
  TableData,
  TableProps,
  TableRow,
  RowFunction,
  MultiListPage,
} from '@console/internal/components/factory';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import {
  Kebab,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
  Timestamp,
  ResourceIcon,
} from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared';

import { PersistentVolumeClaimModel } from '@console/internal/models';
import { VolumeSnapshotModel, SnapshotScheduleModel } from '../../models';
import { getKebabActionsForKind } from '../../utils/kebab-actions';
import { sortable } from '@patternfly/react-table';
import { volumeSnapshotModal } from '../modals/volume-snapshot-modal/volume-snapshot-modal';
import * as _ from 'lodash';

const snapshotMenuActions = [...getKebabActionsForKind(VolumeSnapshotModel)];

const scheduleMenuActions = [...getKebabActionsForKind(SnapshotScheduleModel)];

const snapshotTableColumnClasses = [
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-5', 'col-xs-5'),
  '',
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const getDateString = (value) => {
  const nextSnapshotDate = new Date(value);
  return `${nextSnapshotDate.getUTCFullYear()}${
    nextSnapshotDate.getUTCMonth() < 9
      ? `0${nextSnapshotDate.getUTCMonth() + 1}`
      : nextSnapshotDate.getUTCMonth() + 1
  }${
    nextSnapshotDate.getUTCDate() < 10
      ? `0${nextSnapshotDate.getUTCDate()}`
      : nextSnapshotDate.getUTCDate()
  }${
    nextSnapshotDate.getUTCHours() < 10
      ? `0${nextSnapshotDate.getUTCHours()}`
      : nextSnapshotDate.getUTCHours()
  }${
    nextSnapshotDate.getUTCMinutes() < 10
      ? `0${nextSnapshotDate.getUTCMinutes()}`
      : nextSnapshotDate.getUTCMinutes()
  }`;
};

const getPVCName = () => {
  const urlArrays = window.location.href.split('/');
  const pvc = urlArrays.indexOf('persistentvolumeclaims');
  return urlArrays[pvc + 1];
};

const VolumeSnapshotTableHeader = () => {
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
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[2] },
    },
    {
      title: 'Size',
      sortField: 'status.restoreSize',
      transforms: [sortable],
      props: { className: snapshotTableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: snapshotTableColumnClasses[5] },
    },
  ];
};
VolumeSnapshotTableHeader.displayName = 'SnapshotTableHeader';

const volumeSnapshotKind = referenceFor(VolumeSnapshotModel);

const { details } = navFactory;

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

const DetailsComponent = ({ obj: volumeSnapshot }) => (
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
    pages={[details(DetailsComponent)]}
    breadcrumbsFor={breadcrumbsForSnapshotDetailsPage(props.match)}
  />
);

const VolumeSnapshotTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => (
  <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
    <TableData className={snapshotTableColumnClasses[0]}>
      {obj.kind === VolumeSnapshotModel.kind ? (
        <ResourceLink
          kind={referenceFor(VolumeSnapshotModel)}
          name={getName(obj)}
          namespace={getNamespace(obj)}
          title={getName(obj)}
        />
      ) : (
        <>
          <ResourceIcon kind={volumeSnapshotKind} />
          {`${getPVCName()}-${getName(obj)}-${getDateString(obj?.status?.nextSnapshotTime)}`}
        </>
      )}
    </TableData>
    <TableData className={snapshotTableColumnClasses[1]}>
      {obj.kind === VolumeSnapshotModel.kind ? (
        <Timestamp timestamp={obj?.metadata?.creationTimestamp} />
      ) : (
        <Timestamp timestamp={obj?.status?.nextSnapshotTime} />
      )}
    </TableData>
    <TableData className={snapshotTableColumnClasses[2]}>
      {obj.kind === VolumeSnapshotModel.kind
        ? obj?.status?.readyToUse
          ? 'Ready'
          : 'Not Ready'
        : 'Scheduled'}
    </TableData>
    <TableData className={snapshotTableColumnClasses[3]}>
      {obj.kind === VolumeSnapshotModel.kind ? obj?.status?.restoreSize || 'No Data' : '-'}
    </TableData>
    <TableData className={snapshotTableColumnClasses[5]}>
      <ResourceKebab
        actions={obj.kind === VolumeSnapshotModel.kind ? snapshotMenuActions : scheduleMenuActions}
        kind={
          obj.kind === VolumeSnapshotModel.kind
            ? volumeSnapshotKind
            : referenceForModel(SnapshotScheduleModel)
        }
        resource={obj}
      />
    </TableData>
  </TableRow>
);

export const VolumeSnapshotList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label="Volume Snapshot"
    Header={VolumeSnapshotTableHeader}
    Row={VolumeSnapshotTableRow}
    virtualize
  />
);

export const VolumeSnapshotPage = (props) => {
  const flattern = ({ schedule, snapshot }) => [
    ..._.get(schedule, 'data', []),
    ..._.get(snapshot, 'data', []),
  ];
  const createProps = { onClick: () => volumeSnapshotModal({ ...props }) };
  return (
    <MultiListPage
      {...props}
      namespace={props.namespace}
      canCreate
      showTitle={false}
      resources={[
        {
          kind: referenceForModel(SnapshotScheduleModel),
          namespace: props.ns,
          namespaced: true,
          prop: 'schedule',
        },
        {
          kind: volumeSnapshotKind,
          namespace: props.ns,
          namespaced: true,
          prop: 'snapshot',
        },
      ]}
      flatten={flattern}
      ListComponent={VolumeSnapshotList}
      createButtonText="Create Snapshot"
      createProps={createProps}
    />
  );
};
