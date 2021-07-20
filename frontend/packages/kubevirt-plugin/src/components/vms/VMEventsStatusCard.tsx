import * as React from 'react';
import { Accordion, Text, TextVariants } from '@patternfly/react-core';
import cn from 'classnames';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { EventModel } from '@console/internal/models';
import { EventKind } from '@console/internal/module/k8s';
import { VMKind } from '@console/kubevirt-plugin/src/types';
import EventItem from '@console/shared/src/components/dashboard/activity-card/EventItem';
import { NORMAL } from '../../constants';
import { getNamespace } from '../../selectors';
import { getVmEventsFilters } from '../../selectors/event/filters';

import './vm-events-status-card.scss';

type VMEventsStatusCardProps = {
  vm: VMKind;
};

export const VMEventsStatusCard: React.FC<VMEventsStatusCardProps> = ({ vm }) => {
  const { t } = useTranslation();

  const EventResource = React.useMemo(
    () => ({
      isList: true,
      kind: EventModel.kind,
      namespace: getNamespace(vm),
    }),
    [vm],
  );

  const [filteredEvents, setFilteredEvents] = React.useState<EventKind[]>([]);

  const [events, loadedEvents, eventsErrors] = useK8sWatchResource<EventKind[]>(EventResource);

  const [expanded, setExpanded] = React.useState<string>();

  React.useEffect(() => {
    loadedEvents &&
      setFilteredEvents(
        events
          ?.filter((event) =>
            getVmEventsFilters(vm).some(
              (filter) => filter(event.involvedObject, event) && event?.type !== NORMAL,
            ),
          )
          .slice(0, 2),
      );
  }, [events, loadedEvents, vm]);

  const title = eventsErrors
    ? t('kubevirt-plugin~Error loading events')
    : !loadedEvents
    ? t('kubevirt-plugin~Loading Events...')
    : isEmpty(filteredEvents)
    ? t('kubevirt-plugin~No warning events')
    : null;

  return title ? (
    <Text
      component={TextVariants.p}
      className={cn('kv--vm-event-status-card__title text-secondary', {
        eventsErrors: 'kv--vm-event-status-card__title--errors',
      })}
    >
      {title}
    </Text>
  ) : (
    <Accordion
      asDefinitionList={false}
      headingLevel="h5"
      className="co-activity-card__recent-accordion"
    >
      {filteredEvents.map((event) => (
        <EventItem
          event={event}
          isExpanded={(key: string) => expanded === key}
          onToggle={(key: string) => setExpanded((value) => (value !== key ? key : ''))}
        />
      ))}
    </Accordion>
  );
};

export default VMEventsStatusCard;
