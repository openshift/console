import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button, Chip, ChipGroup, ChipGroupToolbarItem } from '@patternfly/react-core';
import { CloseIcon } from '@patternfly/react-icons';

import { namespaceProptype } from '../propTypes';
import { ResourceListDropdown } from './resource-dropdown';
import { TextFilter } from './factory';
import {
  apiGroupForReference,
  isGroupVersionKind,
  kindForReference,
  referenceFor,
  watchURL,
} from '../module/k8s';
import { withStartGuide } from './start-guide';
import { WSFactory } from '../module/ws-factory';
import { EventModel, NodeModel } from '../models';
import { connectToFlags } from '../reducers/features';
import { FLAGS } from '@console/shared/src/constants';
import {
  Box,
  Dropdown,
  Loading,
  PageHeading,
  pluralize,
  ResourceIcon,
  ResourceLink,
  resourcePathFromModel,
  Timestamp,
  TogglePlay,
} from './utils';
import { EventStreamList } from './utils/event-stream';

const maxMessages = 500;
const flushInterval = 500;

// We have to check different properties depending on whether events were
// created with the core/v1 events API or the new events.k8s.io API.
const getFirstTime = (event) => event.firstTimestamp || event.eventTime;
export const getLastTime = (event) => {
  const lastObservedTime = event.series ? event.series.lastObservedTime : null;
  return event.lastTimestamp || lastObservedTime || event.eventTime;
};
export const sortEvents = (events) => {
  return _.orderBy(events, [getLastTime, getFirstTime, 'name'], ['desc', 'desc', 'asc']);
};

// Predicate function to filter by event "type" (normal, warning, or all)
export const typeFilter = (eventType, event) => {
  if (eventType === 'all') {
    return true;
  }
  const { type = 'normal' } = event;
  return type.toLowerCase() === eventType;
};

const kindFilter = (reference, { involvedObject }) => {
  if (reference === 'all') {
    return true;
  }
  const kinds = reference.split(',');
  return kinds.some((ref) => {
    if (!isGroupVersionKind(ref)) {
      return involvedObject.kind === ref;
    }
    // Use `referenceFor` to resolve `apiVersion` when missing from `involvedObject`.
    // We need `apiVersion` to get the group.
    const involvedObjectRef = referenceFor(involvedObject);
    if (!involvedObjectRef) {
      return false;
    }
    // Only check the group and kind, not the API version, so that we catch
    // events for the same resource under a different API version.
    return (
      involvedObject.kind === kindForReference(ref) &&
      apiGroupForReference(involvedObjectRef) === apiGroupForReference(ref)
    );
  });
};

const Inner = connectToFlags(FLAGS.CAN_LIST_NODE)(
  class Inner extends React.PureComponent {
    render() {
      const { event, flags } = this.props;
      const { involvedObject: obj, source, message, reason, series } = event;
      const tooltipMsg = `${reason} (${obj.kind})`;
      const isWarning = typeFilter('warning', event);
      const firstTime = getFirstTime(event);
      const lastTime = getLastTime(event);
      const count = series ? series.count : event.count;

      return (
        <div className={classNames('co-sysevent', { 'co-sysevent--warning': isWarning })}>
          <div className="co-sysevent__icon-box">
            <i className="co-sysevent-icon" title={tooltipMsg} />
            <div className="co-sysevent__icon-line" />
          </div>
          <div className="co-sysevent__box">
            <div className="co-sysevent__header">
              <div className="co-sysevent__subheader">
                <ResourceLink
                  className="co-sysevent__resourcelink"
                  kind={referenceFor(obj)}
                  namespace={obj.namespace}
                  name={obj.name}
                />
                {obj.namespace && (
                  <ResourceLink
                    className="co-sysevent__resourcelink hidden-xs"
                    kind="Namespace"
                    name={obj.namespace}
                  />
                )}
                {lastTime && <Timestamp className="co-sysevent__timestamp" timestamp={lastTime} />}
              </div>
              <div className="co-sysevent__details">
                <small className="co-sysevent__source">
                  Generated from <span>{source.component}</span>
                  {source.component === 'kubelet' && (
                    <span>
                      {' '}
                      on{' '}
                      {flags[FLAGS.CAN_LIST_NODE] ? (
                        <Link to={resourcePathFromModel(NodeModel, source.host)}>
                          {source.host}
                        </Link>
                      ) : (
                        <>{source.host}</>
                      )}
                    </span>
                  )}
                </small>
                {count > 1 && (
                  <small className="co-sysevent__count text-secondary">
                    {count} times
                    {firstTime && (
                      <>
                        {' '}
                        in the last{' '}
                        <Timestamp timestamp={firstTime} simple={true} omitSuffix={true} />
                      </>
                    )}
                  </small>
                )}
              </div>
            </div>

            <div className="co-sysevent__message">{message}</div>
          </div>
        </div>
      );
    }
  },
);

const eventTypes = { all: 'All Types', normal: 'Normal', warning: 'Warning' };

export class EventsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: 'all',
      textFilter: '',
      selected: new Set(['All']),
    };
  }

  toggleSelected = (selection) => {
    if (this.state.selected.has('All') || selection === 'All') {
      this.setState({ selected: new Set([selection]) });
    } else {
      const updateItems = new Set(this.state.selected);
      updateItems.has(selection) ? updateItems.delete(selection) : updateItems.add(selection);
      this.setState({ selected: updateItems });
    }
  };

  clearSelection = () => {
    this.setState({ selected: new Set(['All']) });
  };

  render() {
    const { type, selected, textFilter } = this.state;
    const { autoFocus = true } = this.props;

    return (
      <>
        <PageHeading detail={true} title={this.props.title}>
          <div className="co-search-group">
            <ResourceListDropdown
              onChange={this.toggleSelected}
              selected={Array.from(selected)}
              showAll
              clearSelection={this.clearSelection}
              className="co-search-group__resource"
            />
            <Dropdown
              className="btn-group co-search-group__resource"
              items={eventTypes}
              onChange={(v) => this.setState({ type: v })}
              selectedKey={type}
              title="All Types"
            />
            <TextFilter
              autoFocus={autoFocus}
              label="Events by name or message"
              onChange={(val) => this.setState({ textFilter: val || '' })}
            />
          </div>
          <div className="form-group">
            <ChipGroup withToolbar defaultIsOpen={false}>
              <ChipGroupToolbarItem key="resources-category" categoryName="Resource">
                {[...selected].map((chip) => (
                  <Chip key={chip} onClick={() => this.toggleSelected(chip)}>
                    <ResourceIcon kind={chip} />
                    {kindForReference(chip)}
                  </Chip>
                ))}
                {selected.size > 0 && (
                  <>
                    <Button variant="plain" aria-label="Close" onClick={this.clearSelection}>
                      <CloseIcon />
                    </Button>
                  </>
                )}
              </ChipGroupToolbarItem>
            </ChipGroup>
          </div>
        </PageHeading>
        <EventStream
          {...this.props}
          key={[...selected].join(',')}
          type={type}
          kind={selected.has('All') || selected.size === 0 ? 'all' : [...selected].join(',')}
          mock={this.props.mock}
          textFilter={textFilter}
        />
      </>
    );
  }
}

export const NoEvents = () => (
  <Box className="co-sysevent-stream__status-box-empty">
    <div className="text-center cos-status-box__detail">No events in the past hour</div>
  </Box>
);

export const NoMatchingEvents = ({ allCount }) => (
  <Box className="co-sysevent-stream__status-box-empty">
    <div className="cos-status-box__title">No matching events</div>
    <div className="text-center cos-status-box__detail">
      {allCount}
      {allCount >= maxMessages && '+'} events exist, but none match the current filter
    </div>
  </Box>
);

export const ErrorLoadingEvents = () => (
  <Box>
    <div className="cos-status-box__title cos-error-title">Error loading events</div>
    <div className="cos-status-box__detail text-center">
      An error occurred during event retrieval. Attempting to reconnect...
    </div>
  </Box>
);

export const EventStreamPage = withStartGuide(({ noProjectsAvailable, ...rest }) => (
  <>
    <Helmet>
      <title>Events</title>
    </Helmet>
    <EventsList
      {...rest}
      autoFocus={!noProjectsAvailable}
      mock={noProjectsAvailable}
      title="Events"
    />
  </>
));

class EventStream extends React.Component {
  constructor(props) {
    super(props);
    this.messages = {};
    this.state = {
      active: true,
      sortedMessages: [],
      filteredEvents: [],
      error: null,
      loading: true,
      oldestTimestamp: new Date(),
    };
    this.toggleStream = this.toggleStream_.bind(this);
  }

  wsInit(ns) {
    const { fieldSelector } = this.props;
    const params = { ns };
    if (fieldSelector) {
      params.queryParams = { fieldSelector: encodeURIComponent(fieldSelector) };
    }

    this.ws = new WSFactory(`${ns || 'all'}-sysevents`, {
      host: 'auto',
      reconnect: true,
      path: watchURL(EventModel, params),
      jsonParse: true,
      bufferFlushInterval: flushInterval,
      bufferMax: maxMessages,
    })
      .onbulkmessage((events) => {
        events.forEach(({ object, type }) => {
          const uid = object.metadata.uid;

          switch (type) {
            case 'ADDED':
            case 'MODIFIED':
              if (this.messages[uid] && this.messages[uid].count > object.count) {
                // We already have a more recent version of this message stored, so skip this one
                return;
              }
              this.messages[uid] = object;
              break;
            case 'DELETED':
              delete this.messages[uid];
              break;
            default:
              // eslint-disable-next-line no-console
              console.error(`UNHANDLED EVENT: ${type}`);
              return;
          }
        });
        this.flushMessages();
      })
      .onopen(() => {
        this.setState({ error: false, loading: false });
      })
      .onclose((evt) => {
        if (evt && evt.wasClean === false) {
          this.setState({ error: evt.reason || 'Connection did not close cleanly.' });
        }
      })
      .onerror(() => {
        this.setState({ error: true });
      });
  }

  componentDidMount() {
    if (!this.props.mock) {
      this.wsInit(this.props.namespace);
    }
  }

  componentWillUnmount() {
    this.ws && this.ws.destroy();
  }

  static filterEvents(messages, { kind, type, filter, textFilter }) {
    // Don't use `fuzzy` because it results in some surprising matches in long event messages.
    // Instead perform an exact substring match on each word in the text filter.
    const words = _.uniq(_.toLower(textFilter).match(/\S+/g)).sort((a, b) => {
      // Sort the longest words first.
      return b.length - a.length;
    });

    const textMatches = (obj) => {
      if (_.isEmpty(words)) {
        return true;
      }
      const name = _.get(obj, 'involvedObject.name', '');
      const message = _.toLower(obj.message);
      return _.every(words, (word) => name.indexOf(word) !== -1 || message.indexOf(word) !== -1);
    };

    const f = (obj) => {
      if (type && !typeFilter(type, obj)) {
        return false;
      }
      if (kind && !kindFilter(kind, obj)) {
        return false;
      }
      if (filter && !filter.some((flt) => flt(obj.involvedObject))) {
        return false;
      }
      if (!textMatches(obj)) {
        return false;
      }
      return true;
    };

    return _.filter(messages, f);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { filter, kind, type, textFilter, loading } = prevState;

    if (
      _.isEqual(filter, nextProps.filter) &&
      kind === nextProps.kind &&
      type === nextProps.type &&
      textFilter === nextProps.textFilter
    ) {
      return {};
    }

    return {
      active: !nextProps.mock,
      loading: !nextProps.mock && loading,
      // update the filteredEvents
      filteredEvents: EventStream.filterEvents(prevState.sortedMessages, nextProps),
      // we need these for bookkeeping because getDerivedStateFromProps doesn't get prevProps
      textFilter: nextProps.textFilter,
      kind: nextProps.kind,
      type: nextProps.type,
      filter: nextProps.filter,
    };
  }

  componentDidUpdate(prevProps) {
    // If the namespace has changed, created a new WebSocket with the new namespace
    if (prevProps.namespace !== this.props.namespace) {
      this.ws && this.ws.destroy();
      this.wsInit(this.props.namespace);
    }
  }

  // Messages can come in extremely fast when the buffer flushes.
  // Instead of calling setState() on every single message, let onmessage()
  // update an instance variable, and throttle the actual UI update (see constructor)
  flushMessages() {
    const sorted = sortEvents(this.messages);
    const oldestTimestamp = _.min([
      this.state.oldestTimestamp,
      getLastTime(new Date(_.last(sorted))),
    ]);
    sorted.splice(maxMessages);
    this.setState({
      oldestTimestamp,
      sortedMessages: sorted,
      filteredEvents: EventStream.filterEvents(sorted, this.props),
    });

    // Shrink this.messages back to maxMessages messages, to stop it growing indefinitely
    this.messages = _.keyBy(sorted, 'metadata.uid');
  }

  toggleStream_() {
    this.setState({ active: !this.state.active }, () => {
      if (this.state.active) {
        this.ws && this.ws.unpause();
      } else {
        this.ws && this.ws.pause();
      }
    });
  }

  render() {
    const { mock, resourceEventStream } = this.props;
    const { active, error, loading, filteredEvents, sortedMessages } = this.state;
    const count = filteredEvents.length;
    const allCount = sortedMessages.length;
    const noEvents = allCount === 0 && this.ws && this.ws.bufferSize() === 0;
    const noMatches = allCount > 0 && count === 0;
    let sysEventStatus, statusBtnTxt;

    if (noEvents || mock || (noMatches && resourceEventStream)) {
      sysEventStatus = <NoEvents />;
    }
    if (noMatches && !resourceEventStream) {
      sysEventStatus = <NoMatchingEvents />;
    }

    if (error) {
      statusBtnTxt = (
        <span className="co-sysevent-stream__connection-error">
          Error connecting to event stream{_.isString(error) && `: ${error}`}
        </span>
      );
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
    const messageCount =
      count < maxMessages
        ? `Showing ${pluralize(count, 'event')}`
        : `Showing ${count} of ${allCount}+ events`;

    return (
      <div className="co-m-pane__body">
        <div className="co-sysevent-stream">
          <div className="co-sysevent-stream__status">
            <div className="co-sysevent-stream__timeline__btn-text">{statusBtnTxt}</div>
            <div className="co-sysevent-stream__totals text-secondary">{messageCount}</div>
          </div>

          <div className={klass}>
            <TogglePlay
              active={active}
              onClick={this.toggleStream}
              className="co-sysevent-stream__timeline__btn"
            />
            <div className="co-sysevent-stream__timeline__end-message">
              There are no events before <Timestamp timestamp={this.state.oldestTimestamp} />
            </div>
          </div>
          {count > 0 && <EventStreamList events={filteredEvents} EventComponent={Inner} />}
          {sysEventStatus}
        </div>
      </div>
    );
  }
}

EventStream.defaultProps = {
  type: 'all',
  kind: 'all',
  mock: false,
};

EventStream.propTypes = {
  type: PropTypes.string,
  filter: PropTypes.array,
  kind: PropTypes.string.isRequired,
  mock: PropTypes.bool,
  namespace: namespaceProptype,
  showTitle: PropTypes.bool,
  textFilter: PropTypes.string,
};

export const ResourceEventStream = ({
  obj: {
    kind,
    metadata: { name, namespace, uid },
  },
}) => (
  <EventStream
    fieldSelector={`involvedObject.uid=${uid},involvedObject.name=${name},involvedObject.kind=${kind}`}
    namespace={namespace}
    resourceEventStream
  />
);

export const ResourcesEventStream = ({ filters, namespace }) => (
  <EventStream filter={filters} resourceEventStream namespace={namespace} />
);
