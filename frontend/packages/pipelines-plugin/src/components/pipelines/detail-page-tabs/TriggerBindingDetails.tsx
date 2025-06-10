import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { EventListenerModel } from '../../../models';
import { getResourceModelFromBindingKind } from '../../../utils/pipeline-augment';
import ResourceLinkList from '../resource-overview/ResourceLinkList';
import { TriggerBindingKind } from '../resource-types';
import { useTriggerBindingEventListenerNames } from '../utils/triggers';

export interface TriggerBindingDetailsProps {
  obj: TriggerBindingKind;
}

const TriggerBindingDetails: React.FC<TriggerBindingDetailsProps> = ({ obj: triggerBinding }) => {
  const { t } = useTranslation();
  const eventListeners: string[] = useTriggerBindingEventListenerNames(triggerBinding);
  return (
    <PaneBody>
      <SectionHeading
        text={t('pipelines-plugin~{{triggerBindingLabel}} details', {
          triggerBindingLabel: t(getResourceModelFromBindingKind(triggerBinding.kind).labelKey),
        })}
      />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={triggerBinding} />
        </GridItem>
        <GridItem sm={6}>
          <ResourceLinkList
            namespace={triggerBinding.metadata.namespace}
            model={EventListenerModel}
            links={eventListeners}
          />
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export default TriggerBindingDetails;
