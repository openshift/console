import * as React from 'react';
import {
  SectionHeading,
  ResourceSummary,
  ResourceLink,
  navFactory,
  Kebab,
  convertToBaseValue,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import {
  PersistentVolumeClaimModel,
  VolumeSnapshotContentModel,
  VolumeSnapshotClassModel,
} from '@console/internal/models';
import { referenceForModel, VolumeSnapshotKind } from '@console/internal/module/k8s';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Status } from '@console/shared';
import { volumeSnapshotStatus } from '../../status';

const { editYaml, events } = navFactory;
const { common, RestorePVC } = Kebab.factory;
const menuActions = [RestorePVC, ...common];

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const { namespace } = obj.metadata || {};
  const { persistentVolumeClaimName: pvcName } = obj.spec?.source || {};
  const size = obj.status?.restoreSize;
  const sizeBase = convertToBaseValue(size);
  const sizeMetrics = size ? humanizeBinaryBytes(sizeBase).string : '-';
  const snapshotContent = obj?.status?.boundVolumeSnapshotContentName;
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
            <dt>Persistent Volume Claim</dt>
            <dd>
              <ResourceLink
                kind={PersistentVolumeClaimModel.kind}
                name={pvcName}
                namespace={namespace}
              />
            </dd>
            {snapshotContent && (
              <>
                <dt>Volume Snapshot Content</dt>
                <dd>
                  <ResourceLink
                    kind={referenceForModel(VolumeSnapshotContentModel)}
                    name={snapshotContent}
                  />
                </dd>
              </>
            )}
            <dt>Volume Snapshot Class</dt>
            <dd>
              <ResourceLink
                kind={referenceForModel(VolumeSnapshotClassModel)}
                name={obj?.spec?.volumeSnapshotClassName}
              />
            </dd>
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

const VolumeSnapshotDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    getResourceStatus={volumeSnapshotStatus}
    menuActions={menuActions}
    pages={pages}
  />
);

type DetailsProps = {
  obj: VolumeSnapshotKind;
};

export default VolumeSnapshotDetailsPage;
