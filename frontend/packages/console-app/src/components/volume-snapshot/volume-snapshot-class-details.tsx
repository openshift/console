import type { FC } from 'react';
import {
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
import type { VolumeSnapshotClassKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import ActionServiceProvider from '@console/shared/src/components/actions/ActionServiceProvider';
import ActionMenu from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

const { editYaml, events } = navFactory;

const Details: FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('console-app~VolumeSnapshotClass details')} />
      <Grid hasGutter>
        <GridItem md={6}>
          <ResourceSummary resource={obj}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Driver')}</DescriptionListTerm>
              <DescriptionListDescription>{obj?.driver}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('console-app~Deletion policy')}</DescriptionListTerm>
              <DescriptionListDescription>{obj?.deletionPolicy}</DescriptionListDescription>
            </DescriptionListGroup>
          </ResourceSummary>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export const VolumeSnapshotClassDetailsPage: FC<DetailsPageProps> = (props) => {
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
  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceForModel(kindObj);
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
  return <DetailsPage {...props} customActionMenu={customActionMenu} pages={pages} />;
};

type DetailsProps = {
  obj: VolumeSnapshotClassKind;
};
