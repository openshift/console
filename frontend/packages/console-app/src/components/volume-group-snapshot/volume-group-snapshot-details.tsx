import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import {
  Kebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  PersistentVolumeClaimModel,
  VolumeGroupSnapshotClassModel,
  VolumeGroupSnapshotContentModel,
} from '@console/internal/models';
import {
  PersistentVolumeClaimKind,
  VolumeGroupSnapshotKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { FLAGS, Status } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { volumeSnapshotStatus } from '../../status';
import { PVCResourceViewer } from './pvc-resource-viewer';

const { editYaml, events } = navFactory;
const { common } = Kebab.factory;
const menuActions = [...common];

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const { namespace } = obj.metadata || {};

  const snapshotContent = obj?.status?.boundVolumeGroupSnapshotContentName;
  const snapshotClass = obj?.spec?.volumeGroupSnapshotClassName;

  const canListVSC = useFlag(FLAGS.CAN_LIST_VGSC);

  const labelExpressions = obj?.spec?.source.selector.matchExpressions;

  const resourceWatch = React.useMemo(() => {
    const matchLabels = obj?.spec?.source?.selector?.matchLabels || {};
    const watch = {
      kind: referenceForModel(PersistentVolumeClaimModel),
      isList: true,
      namespace,
      selector: {
        matchLabels,
        matchExpressions: labelExpressions,
      },
    };

    return watch;
  }, [namespace, obj?.spec?.source?.selector?.matchLabels, labelExpressions]);

  const [data, loaded, loadError] = useK8sWatchResource<PersistentVolumeClaimKind[]>(resourceWatch);

  return (
    <div className="pf-v6-u-m-lg">
      <SectionHeading text={t('console-app~VolumeGroupSnapshot details')} />
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
            <dt>{t('console-app~Source')}</dt>
            <dd>
              {loaded && !loadError && (
                <PVCResourceViewer
                  limit={5}
                  pvcNames={data.map((pvc) => pvc.metadata.name)}
                  namespace={namespace}
                  asList
                />
              )}
            </dd>
            {canListVSC && (
              <>
                <dt>{t('console-app~VolumeGroupSnapshotContent')}</dt>
                <dd data-test="details-item-value__VSC">
                  {snapshotContent ? (
                    <ResourceLink
                      kind={referenceForModel(VolumeGroupSnapshotContentModel)}
                      name={snapshotContent}
                    />
                  ) : (
                    '-'
                  )}
                </dd>
              </>
            )}
            <dt>{t('console-app~VolumeGroupSnapshotClass')}</dt>
            <dd data-test="details-item-value__SC">
              {snapshotClass ? (
                <ResourceLink
                  kind={referenceForModel(VolumeGroupSnapshotClassModel)}
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

const VolumeGroupSnapshotDetailsPage: React.FC<DetailsPageProps> = (props) => {
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
      menuActions={menuActions}
      pages={pages}
    />
  );
};

type DetailsProps = {
  obj: VolumeGroupSnapshotKind;
};

export default VolumeGroupSnapshotDetailsPage;
