import * as _ from 'lodash-es';
import * as React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import { ResourceListDropdown } from './resource-dropdown';
import { TextFilter } from './factory';
import { referenceFor, K8sResourceKind, EventInvolvedObject, EventKind } from '../module/k8s';
import { withStartGuide } from './start-guide';
import { NodeModel } from '../models';
import { connectToFlags } from '../reducers/features';
import { FLAGS } from '../const';
import {
  Dropdown,
  PageHeading,
  ResourceLink,
  resourcePathFromModel,
  Timestamp,
  TogglePlay,
  Box,
  Loading,
  pluralize,
} from './utils';
import { EventStream, EventStreamList, maxMessages, EventStreamChildProps } from './utils/event-stream';

const Inner = React.memo(connectToFlags(FLAGS.CAN_LIST_NODE)(({ event, flags, isError }: InnerProps) => {
  const { message, source, firstTimestamp, lastTimestamp, count, involvedObject: obj, reason } = event;

  const tooltipMsg = `${reason} (${obj.kind})`;
  return (
    <div className={classNames('co-sysevent', {'co-sysevent--error': isError})}>
      <div className="co-sysevent__icon-box">
        <i className="co-sysevent-icon" title={tooltipMsg} />
        <div className="co-sysevent__icon-line"></div>
      </div>
      <div className="co-sysevent__box">
        <div className="co-sysevent__header">
          <div className="co-sysevent__subheader">
            <ResourceLink
              className="co-sysevent__resourcelink"
              kind={referenceFor(obj)}
              namespace={obj.namespace}
              name={obj.name}
              title={obj.uid}
            />
            {obj.namespace && <ResourceLink
              className="co-sysevent__resourcelink hidden-xs"
              kind="Namespace"
              name={obj.namespace}
            />}
            <Timestamp className="co-sysevent__timestamp" timestamp={lastTimestamp} />
          </div>
          <div className="co-sysevent__details">
            <small className="co-sysevent__source">
              Generated from <span>{source.component}</span>
              {source.component === 'kubelet' && <span> on {flags[FLAGS.CAN_LIST_NODE]
                ? <Link to={resourcePathFromModel(NodeModel, source.host)}>{source.host}</Link>
                : <React.Fragment>{source.host}</React.Fragment>}
              </span>}
            </small>
            {count > 1 && <small className="co-sysevent__count text-secondary">
              {count} times in the last <Timestamp timestamp={firstTimestamp} simple={true} omitSuffix={true} />
            </small>}
          </div>
        </div>

        <div className="co-sysevent__message">
          {message}
        </div>
      </div>
    </div>
  );
}));

const categories = {all: 'All Categories', info: 'Info', error: 'Error'};

export const EventsList: React.FC<EventsListProps> = ({mock}) => {
  const [category, setCategory] = React.useState('all');
  const [kind, setKind] = React.useState('all');
  const [textFilter, setTextFilter] = React.useState('');

  return (
    <>
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <ResourceListDropdown
            className="btn-group"
            onChange={setKind}
            selected={kind}
            showAll
          />
          <Dropdown
            className="btn-group"
            items={categories}
            onChange={setCategory}
            selectedKey={category}
            title={categories.all}
          />
        </div>
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter
            label="Events by name or message"
            onChange={e => setTextFilter(e.target.value || '')}
            defaultValue=""
          />
        </div>
      </div>
      <PausibleEventStream
        category={category}
        kind={kind}
        mock={mock}
        textFilter={textFilter}
      />
    </>
  );
};

export const EventStreamPage = withStartGuide(({noProjectsAvailable, ...rest}) =>
  <React.Fragment>
    <Helmet>
      <title>Events</title>
    </Helmet>
    <PageHeading title="Events" />
    <EventsList {...rest} mock={noProjectsAvailable} />
  </React.Fragment>
);

export const NoEvents: React.FC<{}> = () => (
  <Box className="co-sysevent-stream__status-box-empty">
    <div className="text-center cos-status-box__detail">
      No events in the past hour
    </div>
  </Box>
);

export const NoMatchingEvents: React.FC<NoMatchingEventsProps> = ({ allCount }) => (
  <Box className="co-sysevent-stream__status-box-empty">
    <div className="cos-status-box__title">No matching events</div>
    <div className="text-center cos-status-box__detail">
      {allCount}{allCount >= maxMessages && '+'} events exist, but none match the current filter
    </div>
  </Box>
);

export const ErrorLoadingEvents: React.FC<{}> = () => (
  <Box>
    <div className="cos-status-box__title cos-error-title">Error loading events</div>
    <div className="cos-status-box__detail text-center">An error occurred during event retrieval. Attempting to reconnect...</div>
  </Box>
);

const EventsTimeline: React.FC<EventsTimelineProps> = ({
  setActive,
  filteredEvents,
  oldestTimestamp,
  sortedMessages,
  loading,
  active,
  error,
  mock,
  resourceEventStream,
  noEvents,
  noMatches,
}) => {
  let sysEventStatus, statusBtnTxt;

  const count = filteredEvents.length;
  const allCount = sortedMessages.length;
  if (noEvents || mock || (noMatches && resourceEventStream)) {
    sysEventStatus = <NoEvents />;
  }
  if (noMatches && !resourceEventStream) {
    sysEventStatus = <NoMatchingEvents allCount={allCount} />;
  }

  if (error) {
    statusBtnTxt = <span className="co-sysevent-stream__connection-error">Error connecting to event stream{_.isString(error) && `: ${error}`}</span>;
    sysEventStatus = <ErrorLoadingEvents />;
  } else if (loading) {
    statusBtnTxt = <span>Loading events...</span>;
    sysEventStatus = <Loading />;
  } else if (active) {
    statusBtnTxt = <span>Streaming events...</span>;
  } else {
    statusBtnTxt = <span>Event stream is paused.</span>;
  }

  const klass = classNames('co-sysevent-stream__timeline', {
    'co-sysevent-stream__timeline--empty': !allCount || !count,
  });
  const messageCount = count < maxMessages ? `Showing ${pluralize(count, 'event')}` : `Showing ${count} of ${allCount}+ events`;

  return (
    <div className="co-m-pane__body">
      <div className="co-sysevent-stream">
        <div className="co-sysevent-stream__status">
          <div className="co-sysevent-stream__timeline__btn-text">
            { statusBtnTxt }
          </div>
          <div className="co-sysevent-stream__totals text-secondary">
            { messageCount }
          </div>
        </div>

        <div className={klass}>
          <TogglePlay active={active} onClick={() => setActive(!active)} className="co-sysevent-stream__timeline__btn" />
          <div className="co-sysevent-stream__timeline__end-message">
          There are no events before <Timestamp timestamp={oldestTimestamp ? oldestTimestamp.toString() : null} />
          </div>
        </div>
        <EventStreamList EventComponent={Inner} events={filteredEvents} />
        { sysEventStatus }
      </div>
    </div>
  );
};

const PausibleEventStream: React.FC<PausibleEventStream> = ({ filter, category, kind, mock, textFilter, resourceEventStream, namespace }) => {
  const [active, setActive] = React.useState(true);
  return mock ? (
    <EventsTimeline active={active} mock={mock} setActive={setActive} resourceEventStream={resourceEventStream} />
  ) : (
    <EventStream filter={filter} namespace={namespace} active={active} category={category} kind={kind} textFilter={textFilter}>
      <EventsTimeline active={active} setActive={setActive} resourceEventStream={resourceEventStream} />
    </EventStream>
  );
};

export const ResourceEventStream: React.FC<ResourceEventStreamProps> = ({obj: {kind, metadata: {name, namespace}}}) => (
  <PausibleEventStream filter={{name, kind}} namespace={namespace} resourceEventStream />
);

type PausibleEventStream = {
  category?: string;
  kind?: string;
  mock?: boolean;
  textFilter?: string;
  resourceEventStream?: boolean;
  namespace?: string;
  filter?: Partial<EventInvolvedObject>;
}

type ResourceEventStreamProps = {
  obj: K8sResourceKind;
}

type NoMatchingEventsProps = {
  allCount: number;
}

type EventsTimelineProps = Partial<EventStreamChildProps> & {
  setActive: (active: boolean) => void;
  active: boolean;
  resourceEventStream: boolean;
  mock?: boolean;
}

type EventsListProps = {
  mock: boolean;
}

type InnerProps = {
  event: EventKind;
  flags: {[FLAGS.CAN_LIST_NODE]: boolean};
  isError: true;
}
