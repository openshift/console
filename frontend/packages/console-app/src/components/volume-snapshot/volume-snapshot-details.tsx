import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
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
import PaneBody from '@console/shared/src/components/layout/PaneBody';
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
    <PaneBody>
      <SectionHeading text={t('console-app~VolumeSnapshot details')} />
      <div className="row">
        <div className="col-md-6 col-xs-12">
          <ResourceSummary resource={obj}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Status')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Status status={volumeSnapshotStatus(obj)} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </ResourceSummary>
        </div>
        <div className="col-md-6">
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Size')}</DescriptionListTerm>
              <DescriptionListDescription>{size ? sizeMetrics : '-'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Source')}</DescriptionListTerm>
              <DescriptionListDescription>
                <ResourceLink
                  kind={referenceForModel(sourceModel)}
                  name={sourceName}
                  namespace={namespace}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            {canListVSC && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('console-app~VolumeSnapshotContent')}</DescriptionListTerm>
                <DescriptionListDescription data-test="details-item-value__VSC">
                  {snapshotContent ? (
                    <ResourceLink
                      kind={referenceForModel(VolumeSnapshotContentModel)}
                      name={snapshotContent}
                    />
                  ) : (
                    '-'
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~VolumeSnapshotClass')}</DescriptionListTerm>
              <DescriptionListDescription data-test="details-item-value__SC">
                {snapshotClass ? (
                  <ResourceLink
                    kind={referenceForModel(VolumeSnapshotClassModel)}
                    name={snapshotClass}
                  />
                ) : (
                  '-'
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </div>
      </div>
    </PaneBody>
  );
};

const VolumeSnapshotDetailsPage: React.FC<DetailsPageProps> = (props) => {
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
  obj: VolumeSnapshotKind;
};

export default VolumeSnapshotDetailsPage;
