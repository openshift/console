import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { EventListenerKind } from '../resource-types';
import EventListenerTriggers from './EventListenerTriggers';
import EventListenerURL from './EventListenerURL';

export interface EventListenerDetailsProps {
  obj: EventListenerKind;
}

const EventListenerDetails: React.FC<EventListenerDetailsProps> = ({ obj: eventListener }) => {
  const { t } = useTranslation();
  const triggers =
    eventListener.spec.triggers?.filter(
      (trigger) => trigger.template?.ref || trigger.template?.name,
    ) || [];
  return (
    <PaneBody>
      <SectionHeading text={t('pipelines-plugin~EventListener details')} />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={eventListener} />
        </GridItem>
        <GridItem sm={6}>
          <EventListenerURL
            eventListener={eventListener}
            namespace={eventListener.metadata.namespace}
          />
          {triggers.length > 0 && (
            <EventListenerTriggers
              namespace={eventListener.metadata.namespace}
              triggers={triggers}
            />
          )}
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export default EventListenerDetails;
