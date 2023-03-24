import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
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
import { Status } from '@console/shared';
import { volumeSnapshotStatus } from '../../status';

const { editYaml, events } = navFactory;

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const { deletionPolicy, driver } = obj?.spec;
  const { volumeHandle, snapshotHandle } = obj?.spec?.source || {};
  const { name: snapshotName, namespace: snapshotNamespace } = obj?.spec?.volumeSnapshotRef || {};
  const size = obj.status?.restoreSize;
  const sizeMetrics = size ? humanizeBinaryBytes(size).string : '-';

  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('console-app~VolumeSnapshotContent details')} />
      <div className="row">
        <div className="col-md-6 col-xs-12">
          <ResourceSummary resource={obj}>
            <dt>{t('console-app~Status')}</dt>
            <dd>
              <Status status={volumeSnapshotStatus(obj)} />
            </dd>
          </ResourceSummary>
        </div>
        <div className="col-md-6">
          <dl className="co-m-pane__details">
            {size && (
              <>
                <dt>{t('console-app~Size')}</dt>
                <dd>{sizeMetrics}</dd>
              </>
            )}
            <dt>{t('console-app~VolumeSnapshot')}</dt>
            <dd>
              <ResourceLink
                kind={referenceForModel(VolumeSnapshotModel)}
                name={snapshotName}
                namespace={snapshotNamespace}
              />
            </dd>
            <dt>{t('console-app~VolumeSnapshotClass')}</dt>
            <dd>
              <ResourceLink
                kind={referenceForModel(VolumeSnapshotClassModel)}
                name={obj?.spec?.volumeSnapshotClassName}
              />
            </dd>
            <dt>{t('console-app~Deletion policy')}</dt>
            <dd>{deletionPolicy}</dd>
            <dt>{t('console-app~Driver')}</dt>
            <dd>{driver}</dd>
            {volumeHandle && (
              <>
                <dt>{t('console-app~Volume handle')}</dt>
                <dd>{volumeHandle}</dd>
              </>
            )}
            {snapshotHandle && (
              <>
                <dt>{t('console-app~Snapshot handle')}</dt>
                <dd>{snapshotHandle}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

const VolumeSnapshotContentDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const pages = [
    {
      href: '',
      name: t('console-app~Details'),
      component: Details,
    },
    editYaml(),
    events(ResourceEventStream),
  ];
  return (
    <DetailsPage
      {...props}
      getResourceStatus={volumeSnapshotStatus}
      menuActions={Kebab.factory.common}
      pages={pages}
    />
  );
};

type DetailsProps = {
  obj: VolumeSnapshotContentKind;
};

export default VolumeSnapshotContentDetailsPage;
