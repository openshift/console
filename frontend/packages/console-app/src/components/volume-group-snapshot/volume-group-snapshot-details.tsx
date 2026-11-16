import type { FC } from 'react';
import { useMemo } from 'react';
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
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import {
  VolumeGroupSnapshotClassModel,
  VolumeGroupSnapshotContentModel,
  VolumeSnapshotModel,
} from '@console/internal/models';
import type { VolumeGroupSnapshotKind, VolumeSnapshotKind } from '@console/internal/module/k8s';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { ActionServiceProvider } from '@console/shared/src/components/actions/ActionServiceProvider';
import { ActionMenu } from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { Status } from '@console/shared/src/components/status/Status';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { groupSnapshotStatus } from '@console/shared/src/sorts/snapshot';
import { PVCResourceViewer } from './pvc-resource-viewer';

const { editYaml, events } = navFactory;

const Details: FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation('console-app');
  const name = obj?.metadata?.name || '';
  const namespace = obj?.metadata?.namespace || '';

  const snapshotContent = obj?.status?.boundVolumeGroupSnapshotContentName;
  const snapshotClass = obj?.spec?.volumeGroupSnapshotClassName;

  const canListVGSC = useFlag(FLAGS.CAN_LIST_VGSC);

  const [volumeSnapshots, loaded, loadError] = useK8sWatchResource<VolumeSnapshotKind[]>({
    groupVersionKind: {
      group: VolumeSnapshotModel.apiGroup,
      kind: VolumeSnapshotModel.kind,
      version: VolumeSnapshotModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
  });

  // Derive group membership from the actual bound VolumeSnapshots (via ownerReferences)
  // instead of re-evaluating spec.source.selector client-side, so this reflects what the
  // backend actually snapshotted rather than what the selector was intended to match.
  const pvcNames = useMemo(
    () =>
      loaded && !loadError
        ? volumeSnapshots
            .filter((vs) =>
              vs?.metadata?.ownerReferences?.some(
                (ref) => ref.kind === 'VolumeGroupSnapshot' && ref.name === name,
              ),
            )
            .map((vs) => vs?.spec?.source?.persistentVolumeClaimName)
            .filter(Boolean)
        : [],
    [volumeSnapshots, loaded, loadError, name],
  );

  return (
    <PaneBody>
      <SectionHeading text={t('VolumeGroupSnapshot details')} />
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
              <DescriptionListTerm>{t('Source')}</DescriptionListTerm>
              <DescriptionListDescription>
                {loaded && !loadError && (
                  <PVCResourceViewer limit={5} pvcNames={pvcNames} namespace={namespace} asList />
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {canListVGSC && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('VolumeGroupSnapshotContent')}</DescriptionListTerm>
                <DescriptionListDescription data-test="details-item-value__VSC">
                  {snapshotContent ? (
                    <ResourceLink
                      kind={referenceForModel(VolumeGroupSnapshotContentModel)}
                      name={snapshotContent}
                    />
                  ) : (
                    '-'
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>{t('VolumeGroupSnapshotClass')}</DescriptionListTerm>
              <DescriptionListDescription data-test="details-item-value__SC">
                {snapshotClass ? (
                  <ResourceLink
                    kind={referenceForModel(VolumeGroupSnapshotClassModel)}
                    name={snapshotClass}
                  />
                ) : (
                  '-'
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export const VolumeGroupSnapshotDetailsPage: FC<DetailsPageProps> = (props) => {
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
  const customActionMenu = (_, obj: VolumeGroupSnapshotKind) => {
    const resourceKind = referenceFor(obj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };
  return (
    <DetailsPage
      {...props}
      customActionMenu={customActionMenu}
      getResourceStatus={groupSnapshotStatus}
      pages={pages}
    />
  );
};

type DetailsProps = {
  obj: VolumeGroupSnapshotKind;
};
