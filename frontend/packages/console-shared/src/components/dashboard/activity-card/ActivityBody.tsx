import * as React from 'react';
import { Accordion } from '@patternfly/react-core';
import { PlayIcon, PauseIcon } from '@patternfly/react-icons';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ActivityBodyProps,
  OngoingActivityBodyProps,
  RecentEventsBodyProps,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { ErrorLoadingEvents, sortEvents } from '@console/internal/components/events';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { Timestamp } from '@console/internal/components/utils/timestamp';
import { EventKind } from '@console/internal/module/k8s';
import { DashboardCardButtonLink } from '../dashboard-card/DashboardCardLink';
import EventItem from './EventItem';

import './activity-card.scss';

export const Activity: React.FC<ActivityProps> = ({ timestamp, children }) => {
  const { t } = useTranslation();
  return (
    <div className="co-activity-item__ongoing" data-test="activity">
      {timestamp && (
        <span className="text-secondary">
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

export const RecentEventsBodyContent: React.FC<RecentEventsBodyContentProps> = ({
  events,
  filter,
  paused,
  setPaused,
  moreLink,
}) => {
  const { t } = useTranslation();
  const ref = React.useRef<EventKind[]>([]);
  React.useEffect(() => {
    if (paused && events) {
      ref.current = events.data;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);
  if (!paused && events) {
    ref.current = events.data;
  }
  const eventsData = ref.current;
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const onToggle = React.useCallback(
    (uid: string) => {
      const isExpanded = expanded.includes(uid);
      const newExpanded = isExpanded ? expanded.filter((e) => e !== uid) : [...expanded, uid];
      setPaused(isExpanded ? !!newExpanded.length : !isExpanded);
      setExpanded(newExpanded);
    },
    [expanded, setPaused],
  );
  const isExpanded = React.useCallback(
    (uid: string) => {
      return expanded.includes(uid);
    },
    [expanded],
  );

  if (events && events.loadError) {
    return <ErrorLoadingEvents />;
  }
  if (!(events && events.loaded)) {
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

  const filteredEvents = filter ? eventsData.filter(filter) : eventsData;
  const sortedEvents: EventKind[] = sortEvents(filteredEvents);
  const lastEvents = sortedEvents.slice(0, 50);
  if (sortedEvents.length === 0) {
    return (
      <Activity>
        <div className="text-secondary">{t('console-shared~There are no recent events.')}</div>
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
      {sortedEvents.length > 50 && !!moreLink && (
        <Link
          className="co-activity-card__recent-more-link"
          to={moreLink}
          data-test="events-view-all-link"
        >
          {t('console-shared~View all events')}
        </Link>
      )}
    </>
  );
};

export const PauseButton: React.FC<PauseButtonProps> = ({ paused, togglePause }) => {
  const { t } = useTranslation();
  return (
    <DashboardCardButtonLink
      onClick={togglePause}
      className="co-activity-card__recent-actions"
      icon={paused ? <PlayIcon /> : <PauseIcon />}
      data-test-id="events-pause-button"
      data-test="events-pause-button"
    >
      {paused ? t('console-shared~Resume') : t('console-shared~Pause')}
    </DashboardCardButtonLink>
  );
};

export const RecentEventsBody: React.FC<RecentEventsBodyProps> = (props) => {
  const { t } = useTranslation();
  const [paused, setPaused] = React.useState(false);
  const togglePause = React.useCallback(() => setPaused(!paused), [paused]);
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

export const OngoingActivityBody: React.FC<OngoingActivityBodyProps> = ({
  loaded,
  resourceActivities = [],
  prometheusActivities = [],
}) => {
  const { t } = useTranslation();
  const activitiesLoaded =
    loaded || resourceActivities.length > 0 || prometheusActivities.length > 0;
  let body: React.ReactNode;
  if (!activitiesLoaded) {
    body = (
      <div className="co-activity-item__ongoing">
        <div className="skeleton-activity__dashboard" />
      </div>
    );
  } else {
    const allActivities = prometheusActivities.map(
      ({ results, loader, component: Component }, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <Activity key={idx}>
          {loader ? (
            <AsyncComponent loader={loader} results={results} />
          ) : (
            <Component results={results} />
          )}
        </Activity>
      ),
    );
    resourceActivities
      .sort((a, b) => +b.timestamp - +a.timestamp)
      .forEach(({ resource, timestamp, loader, component: Component }) =>
        allActivities.push(
          <Activity key={resource.metadata.uid} timestamp={timestamp}>
            {loader ? (
              <AsyncComponent loader={loader} resource={resource} />
            ) : (
              <Component resource={resource} />
            )}
          </Activity>,
        ),
      );
    body = allActivities.length ? (
      allActivities
    ) : (
      <Activity>
        <div className="text-secondary">{t('console-shared~There are no ongoing activities.')}</div>
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

const ActivityBody: React.FC<ActivityBodyProps> = ({ children, className }) => (
  <div
    className={classNames('co-dashboard-card__body--no-padding co-activity-card__body', className)}
    id="activity-body"
  >
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
  children: React.ReactNode;
};

type PauseButtonProps = {
  paused: boolean;
  togglePause: () => void;
};
