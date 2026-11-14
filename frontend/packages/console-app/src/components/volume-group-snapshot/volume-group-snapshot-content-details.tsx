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
import { VolumeGroupSnapshotClassModel, VolumeGroupSnapshotModel } from '@console/internal/models';
import type { VolumeGroupSnapshotContentKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { Status } from '@console/shared/src/components/status/Status';
import { groupSnapshotStatus } from '@console/shared/src/sorts/snapshot';

const { editYaml, events } = navFactory;

const Details: FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation('console-app');
  const deletionPolicy = obj?.spec?.deletionPolicy || '';
  const driver = obj?.spec?.driver || '';
  const { volumeHandles, groupSnapshotHandles } = obj?.spec?.source || {};
  const { name: snapshotName, namespace: snapshotNamespace } =
    obj?.spec?.volumeGroupSnapshotRef || {};

  return (
    <PaneBody>
      <SectionHeading text={t('VolumeGroupSnapshotContent details')} />
      <Grid hasGutter>
        <GridItem md={6}>
          <ResourceSummary resource={obj}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Status status={groupSnapshotStatus(obj)} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </ResourceSummary>
        </GridItem>
        <GridItem md={6}>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('VolumeGroupSnapshot')}</DescriptionListTerm>
              <DescriptionListDescription>
                <ResourceLink
                  kind={referenceForModel(VolumeGroupSnapshotModel)}
                  name={snapshotName}
                  namespace={snapshotNamespace}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('VolumeGroupSnapshotClass')}</DescriptionListTerm>
              <DescriptionListDescription>
                <ResourceLink
                  kind={referenceForModel(VolumeGroupSnapshotClassModel)}
                  name={obj?.spec?.volumeGroupSnapshotClassName}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Deletion policy')}</DescriptionListTerm>
              <DescriptionListDescription>{deletionPolicy}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Driver')}</DescriptionListTerm>
              <DescriptionListDescription>{driver}</DescriptionListDescription>
            </DescriptionListGroup>
            {volumeHandles && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Volume handle')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {volumeHandles.map((handle) => (
                    <div key={handle}>{handle}</div>
                  ))}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {groupSnapshotHandles && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('GroupSnapshot handle')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {groupSnapshotHandles.volumeGroupSnapshotHandle}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

const VolumeGroupSnapshotContentDetailsPage: FC<DetailsPageProps> = (props) => {
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
  return <DetailsPage {...props} getResourceStatus={groupSnapshotStatus} pages={pages} />;
};

type DetailsProps = {
  obj: VolumeGroupSnapshotContentKind;
};

export default VolumeGroupSnapshotContentDetailsPage;
