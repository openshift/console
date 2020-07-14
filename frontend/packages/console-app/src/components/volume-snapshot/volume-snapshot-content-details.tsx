import * as React from 'react';
import {
  SectionHeading,
  ResourceSummary,
  ResourceLink,
  navFactory,
  Kebab,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import { VolumeSnapshotClassModel, VolumeSnapshotModel } from '@console/internal/models';
import { referenceForModel, VolumeSnapshotContentKind } from '@console/internal/module/k8s';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Status } from '@console/shared';
import { ResourceEventStream } from '@console/internal/components/events';
import { volumeSnapshotStatus } from '../../status';

const { editYaml, events } = navFactory;

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const { deletionPolicy, driver } = obj?.spec;
  const { volumeHandle, snapshotHandle } = obj?.spec?.source || {};
  const { name: snapshotName, namespace: snapshotNamespace } = obj?.spec?.volumeSnapshotRef || {};
  const size = obj.status?.restoreSize;
  const sizeMetrics = size ? humanizeBinaryBytes(size).string : '-';

  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Volume Snapshot Details" />
      <div className="row">
        <div className="col-md-6 col-xs-12">
          <ResourceSummary resource={obj}>
            <dt>Status</dt>
            <dd>
              <Status status={volumeSnapshotStatus(obj)} />
            </dd>
          </ResourceSummary>
        </div>
        <div className="col-md-6">
          <dl className="co-m-pane__details">
            {size && (
              <>
                <dt>Size</dt>
                <dd>{sizeMetrics}</dd>
              </>
            )}
            <dt>Volume Snapshot</dt>
            <dd>
              <ResourceLink
                kind={referenceForModel(VolumeSnapshotModel)}
                name={snapshotName}
                namespace={snapshotNamespace}
              />
            </dd>
            <dt>Snapshot Class</dt>
            <dd>
              <ResourceLink
                kind={referenceForModel(VolumeSnapshotClassModel)}
                name={obj?.spec?.volumeSnapshotClassName}
              />
            </dd>
            <dt>Deletion Policy</dt>
            <dd>{deletionPolicy}</dd>
            <dt>Driver</dt>
            <dd>{driver}</dd>
            {volumeHandle && (
              <>
                <dt>Volume Handle</dt>
                <dd>{volumeHandle}</dd>
              </>
            )}
            {snapshotHandle && (
              <>
                <dt>Snapshot Handle</dt>
                <dd>{snapshotHandle}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

const pages = [
  {
    href: '',
    name: 'Details',
    component: Details,
  },
  editYaml(),
  events(ResourceEventStream),
];

const VolumeSnapshotContentDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    getResourceStatus={volumeSnapshotStatus}
    menuActions={Kebab.factory.common}
    pages={pages}
  />
);

type DetailsProps = {
  obj: VolumeSnapshotContentKind;
};

export default VolumeSnapshotContentDetailsPage;
