import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceEventStream } from '@console/internal/components/events';
import type { DetailsPageProps } from '@console/internal/components/factory';
import { DetailsPage } from '@console/internal/components/factory';
import { ResourceSummary } from '@console/internal/components/utils/details-page';
import { SectionHeading } from '@console/internal/components/utils/headings';
import { navFactory } from '@console/internal/components/utils/horizontal-nav';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { humanizeBinaryBytes } from '@console/internal/components/utils/units';
import { VolumeSnapshotClassModel, VolumeSnapshotModel } from '@console/internal/models';
import type { VolumeSnapshotContentKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { Status } from '@console/shared/src/components/status/Status';
import { volumeSnapshotStatus } from '../../status';

const { editYaml, events } = navFactory;

const Details: FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const deletionPolicy = obj?.spec?.deletionPolicy || '';
  const driver = obj?.spec?.driver || '';
  const { volumeHandle, snapshotHandle } = obj?.spec?.source || {};
  const { name: snapshotName, namespace: snapshotNamespace } = obj?.spec?.volumeSnapshotRef || {};
  const size = obj.status?.restoreSize;
  const sizeMetrics = size ? humanizeBinaryBytes(size).string : '-';

  return (
    <PaneBody>
      <SectionHeading text={t('console-app~VolumeSnapshotContent details')} />
      <Grid hasGutter>
        <GridItem md={6}>
          <ResourceSummary resource={obj}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Status')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Status status={volumeSnapshotStatus(obj)} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </ResourceSummary>
        </GridItem>
        <GridItem md={6}>
          <DescriptionList>
            {size && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('console-app~Size')}</DescriptionListTerm>
                <DescriptionListDescription>{sizeMetrics}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~VolumeSnapshot')}</DescriptionListTerm>
              <DescriptionListDescription>
                <ResourceLink
                  kind={referenceForModel(VolumeSnapshotModel)}
                  name={snapshotName}
                  namespace={snapshotNamespace}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~VolumeSnapshotClass')}</DescriptionListTerm>
              <DescriptionListDescription>
                <ResourceLink
                  kind={referenceForModel(VolumeSnapshotClassModel)}
                  name={obj?.spec?.volumeSnapshotClassName}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Deletion policy')}</DescriptionListTerm>
              <DescriptionListDescription>{deletionPolicy}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Driver')}</DescriptionListTerm>
              <DescriptionListDescription>{driver}</DescriptionListDescription>
            </DescriptionListGroup>
            {volumeHandle && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('console-app~Volume handle')}</DescriptionListTerm>
                <DescriptionListDescription>{volumeHandle}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {snapshotHandle && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('console-app~Snapshot handle')}</DescriptionListTerm>
                <DescriptionListDescription>{snapshotHandle}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

const VolumeSnapshotContentDetailsPage: FC<DetailsPageProps> = (props) => {
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
  return <DetailsPage {...props} getResourceStatus={volumeSnapshotStatus} pages={pages} />;
};

type DetailsProps = {
  obj: VolumeSnapshotContentKind;
};

export default VolumeSnapshotContentDetailsPage;
