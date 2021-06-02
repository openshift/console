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
  convertToBaseValue,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import {
  PersistentVolumeClaimModel,
  VolumeSnapshotContentModel,
  VolumeSnapshotClassModel,
} from '@console/internal/models';
import { referenceForModel, VolumeSnapshotKind } from '@console/internal/module/k8s';
import { Status, snapshotSource, FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { volumeSnapshotStatus } from '../../status';

const { editYaml, events } = navFactory;
const { common, RestorePVC } = Kebab.factory;
const menuActions = [RestorePVC, ...common];

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const { namespace } = obj.metadata || {};
  const sourceModel = obj?.spec?.source?.persistentVolumeClaimName
    ? PersistentVolumeClaimModel
    : VolumeSnapshotContentModel;
  const sourceName = snapshotSource(obj);
  const size = obj.status?.restoreSize;
  const sizeBase = convertToBaseValue(size);
  const sizeMetrics = size ? humanizeBinaryBytes(sizeBase).string : '-';
  const snapshotContent = obj?.status?.boundVolumeSnapshotContentName;
  const snapshotClass = obj?.spec?.volumeSnapshotClassName;

  const canListVSC = useFlag(FLAGS.CAN_LIST_VSC);

  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('console-app~VolumeSnapshot details')} />
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
            <dt>{t('console-app~Size')}</dt>
            <dd>{size ? sizeMetrics : '-'}</dd>
            <dt>{t('console-app~Source')}</dt>
            <dd>
              <ResourceLink
                kind={referenceForModel(sourceModel)}
                name={sourceName}
                namespace={namespace}
              />
            </dd>
            {canListVSC && (
              <>
                <dt>{t('console-app~VolumeSnapshotContent')}</dt>
                <dd data-test="details-item-value__VSC">
                  {snapshotContent ? (
                    <ResourceLink
                      kind={referenceForModel(VolumeSnapshotContentModel)}
                      name={snapshotContent}
                    />
                  ) : (
                    '-'
                  )}
                </dd>
              </>
            )}
            <dt>{t('console-app~VolumeSnapshotClass')}</dt>
            <dd data-test="details-item-value__SC">
              {snapshotClass ? (
                <ResourceLink
                  kind={referenceForModel(VolumeSnapshotClassModel)}
                  name={snapshotClass}
                />
              ) : (
                '-'
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

const VolumeSnapshotDetailsPage: React.FC<DetailsPageProps> = (props) => {
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
      menuActions={menuActions}
      pages={pages}
    />
  );
};

type DetailsProps = {
  obj: VolumeSnapshotKind;
};

export default VolumeSnapshotDetailsPage;
