import type { FC, ReactNode } from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Accordion, Button } from '@patternfly/react-core';
import { PauseIcon } from '@patternfly/react-icons/dist/esm/icons/pause-icon';
import { PlayIcon } from '@patternfly/react-icons/dist/esm/icons/play-icon';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import {
  ActivityBodyProps,
  OngoingActivityBodyProps,
  RecentEventsBodyProps,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { ErrorLoadingEvents, sortEvents } from '@console/internal/components/events';
import { EventKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ErrorBoundaryInline } from '@console/shared/src/components/error';
import EventItem from './EventItem';

import './activity-card.scss';

export const Activity: FC<ActivityProps> = ({ timestamp, children }) => {
  const { t } = useTranslation();
  return (
    <div className="co-activity-item__ongoing" data-test="activity">
      {timestamp && (
        <span className="pf-v6-u-text-color-subtle">
          {t('console-shared~Started')}{' '}
          <span data-test="timestamp">
            <Timestamp simple timestamp={timestamp.toString()} />
          </span>
        </span>
      )}
      {children}
    </div>
  );
};

export const RecentEventsBodyContent: FC<RecentEventsBodyContentProps> = ({
  eventsData,
  eventsLoaded,
  eventsLoadError,
  filter,
  paused,
  setPaused,
}) => {
  const { t } = useTranslation();
  const ref = useRef<EventKind[]>([]);
  useEffect(() => {
    if (paused && eventsData) {
      ref.current = eventsData;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);
  if (!paused && eventsData) {
    ref.current = eventsData;
  }
  const currentEventsData = ref.current;
  const [expanded, setExpanded] = useState<string[]>([]);
  const onToggle = useCallback(
    (uid: string) => {
      const isExpanded = expanded.includes(uid);
      const newExpanded = isExpanded ? expanded.filter((e) => e !== uid) : [...expanded, uid];
      setPaused(isExpanded ? !!newExpanded.length : !isExpanded);
      setExpanded(newExpanded);
    },
    [expanded, setPaused],
  );
  const isExpanded = useCallback(
    (uid: string) => {
      return expanded.includes(uid);
    },
    [expanded],
  );

  if (eventsLoadError) {
    return <ErrorLoadingEvents />;
  }
  if (!eventsLoaded) {
    return (
      <div className="co-status-card__alerts-body">
        <div className="co-status-card__alert-item co-status-card__alert-item--loading">
          <div className="skeleton-activity__dashboard" />
          <div className="skeleton-activity__dashboard" />
          <div className="skeleton-activity__dashboard" />
          <div className="skeleton-activity__dashboard" />
          <div className="skeleton-activity__dashboard" />
        </div>
      </div>
    );
  }

  const filteredEvents = filter ? currentEventsData.filter(filter) : currentEventsData;
  const sortedEvents: EventKind[] = sortEvents(filteredEvents);
  const lastEvents = sortedEvents.slice(0, 50);
  if (sortedEvents.length === 0) {
    return (
      <Activity>
        <div className="pf-v6-u-text-color-subtle">
          {t('console-shared~There are no recent events.')}
        </div>
      </Activity>
    );
  }
  return (
    <>
      <Accordion
        asDefinitionList={false}
        headingLevel="h5"
        className="co-activity-card__recent-accordion"
      >
        {lastEvents.map((e) => (
          <EventItem key={e.metadata.uid} isExpanded={isExpanded} onToggle={onToggle} event={e} />
        ))}
      </Accordion>
    </>
  );
};

export const PauseButton: FC<PauseButtonProps> = ({ paused, togglePause }) => {
  const { t } = useTranslation();
  return (
    <Button
      variant="link"
      isInline
      onClick={togglePause}
      className="co-activity-card__recent-actions"
      icon={paused ? <PlayIcon /> : <PauseIcon />}
      data-test-id="events-pause-button"
      data-test="events-pause-button"
    >
      {paused ? t('console-shared~Resume') : t('console-shared~Pause')}
    </Button>
  );
};

export const RecentEventsBody: FC<RecentEventsBodyProps> = (props) => {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const togglePause = useCallback(() => setPaused(!paused), [paused]);
  return (
    <>
      <div className="co-activity-card__recent-title" data-test="activity-recent-title">
        {t('console-shared~Recent events')}
        <PauseButton paused={paused} togglePause={togglePause} />
      </div>
      <RecentEventsBodyContent {...props} paused={paused} setPaused={setPaused} />
    </>
  );
};

export const OngoingActivityBody: FC<OngoingActivityBodyProps> = ({
  loaded,
  resourceActivities = [],
  prometheusActivities = [],
}) => {
  const { t } = useTranslation();
  const activitiesLoaded =
    loaded || resourceActivities.length > 0 || prometheusActivities.length > 0;
  let body: ReactNode;
  if (!activitiesLoaded) {
    body = (
      <div className="co-activity-item__ongoing">
        <div className="skeleton-activity__dashboard" />
      </div>
    );
  } else {
    const allActivities = prometheusActivities.map(({ results, component: Component }, idx) => (
      // eslint-disable-next-line react/no-array-index-key
      <Activity key={idx}>
        <ErrorBoundaryInline>
          <Component results={results} />
        </ErrorBoundaryInline>
      </Activity>
    ));
    resourceActivities
      .sort((a, b) => +b.timestamp - +a.timestamp)
      .forEach(({ resource, timestamp, component: Component }) =>
        allActivities.push(
          <Activity key={resource.metadata.uid} timestamp={timestamp}>
            <ErrorBoundaryInline>
              <Component resource={resource} />
            </ErrorBoundaryInline>
          </Activity>,
        ),
      );
    body = allActivities.length ? (
      allActivities
    ) : (
      <Activity>
        <div className="pf-v6-u-text-color-subtle">
          {t('console-shared~There are no ongoing activities.')}
        </div>
      </Activity>
    );
  }
  return (
    <>
      <div className="co-activity-card__ongoing-title" data-test="ongoing-title">
        {t('console-shared~Ongoing')}
      </div>
      <div className="co-activity-card__ongoing-body">{body}</div>
    </>
  );
};

const ActivityBody: FC<ActivityBodyProps> = ({ children, className }) => (
  <div className={css('co-activity-card__body', className)} id="activity-body">
    {children}
  </div>
);

export default ActivityBody;

type RecentEventsBodyContentProps = RecentEventsBodyProps & {
  paused?: boolean;
  setPaused?: (paused: boolean) => void;
};

type ActivityProps = {
  timestamp?: Date;
  children: ReactNode;
};

type PauseButtonProps = {
  paused: boolean;
  togglePause: () => void;
};
