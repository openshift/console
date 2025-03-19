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
} from '@console/internal/components/utils';
import { VolumeGroupSnapshotClassModel, VolumeGroupSnapshotModel } from '@console/internal/models';
import { referenceForModel, VolumeGroupSnapshotContentKind } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { volumeSnapshotStatus } from '../../status';

const { editYaml, events } = navFactory;

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const { deletionPolicy, driver } = obj?.spec;
  const { volumeHandles, groupSnapshotHandles } = obj?.spec?.source || {};
  const { name: snapshotName, namespace: snapshotNamespace } =
    obj?.spec?.volumeGroupSnapshotRef || {};

  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('console-app~VolumeGroupSnapshotContent details')} />
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
            <dt>{t('console-app~VolumeGroupSnapshot')}</dt>
            <dd>
              <ResourceLink
                kind={referenceForModel(VolumeGroupSnapshotModel)}
                name={snapshotName}
                namespace={snapshotNamespace}
              />
            </dd>
            <dt>{t('console-app~VolumeGroupSnapshotClass')}</dt>
            <dd>
              <ResourceLink
                kind={referenceForModel(VolumeGroupSnapshotClassModel)}
                name={obj?.spec?.volumeGroupSnapshotClassName}
              />
            </dd>
            <dt>{t('console-app~Deletion policy')}</dt>
            <dd>{deletionPolicy}</dd>
            <dt>{t('console-app~Driver')}</dt>
            <dd>{driver}</dd>
            {volumeHandles && (
              <>
                <dt>{t('console-app~Volume handle')}</dt>
                {volumeHandles.map((handle) => (
                  <dd>{handle}</dd>
                ))}
              </>
            )}
            {groupSnapshotHandles && (
              <>
                <dt>{t('console-app~GroupSnapshot handle')}</dt>
                <dd>{groupSnapshotHandles.volumeGroupSnapshotHandle}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

const VolumeGroupSnapshotContentDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const pages = [
    {
      href: '',
      // t('console-app~Details')
      nameKey: 'console-app~Details',
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
  obj: VolumeGroupSnapshotContentKind;
};

export default VolumeGroupSnapshotContentDetailsPage;
