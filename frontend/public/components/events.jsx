/* eslint-disable @typescript-eslint/no-use-before-define, tsdoc/syntax */
import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import { Link, useParams } from 'react-router-dom-v5-compat';
import { Helmet } from 'react-helmet';
import { Button, ButtonSize, ButtonVariant, Chip, ChipGroup } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';

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
import { connectToFlags } from '../reducers/connectToFlags';
import { FLAGS } from '@console/shared/src/constants';
import {
  Box,
  Dropdown,
  Loading,
  PageHeading,
  ResourceIcon,
  ResourceLink,
  resourcePathFromModel,
  Timestamp,
  TogglePlay,
} from './utils';
import { EventStreamList } from './utils/event-stream';
import CloseButton from '@console/shared/src/components/close-button';
import { ActionMenu, ActionMenuVariant, ActionServiceProvider } from '@console/shared';
import ActionMenuItem from '@console/shared/src/components/actions/menu/ActionMenuItem';

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
  if (!reference) {
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

const Actions = ({ actions, options, list, cache, index }) => {
  React.useEffect(() => {
    // Actions contents will render after the initial row height calculation,
    // so recompute the row height.
    cache.clear(index);
    list?.recomputeRowHeights(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="co-sysevent__actions">
      {actions.length === 1 ? (
        <ActionMenuItem
          action={actions[0]}
          component={(props) => (
            <Button variant={ButtonVariant.secondary} size={ButtonSize.sm} {...props} />
          )}
        />
      ) : (
        <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
      )}
    </div>
  );
};

const Inner = connectToFlags(FLAGS.CAN_LIST_NODE)((props) => {
  const { t } = useTranslation();
  const { event, flags, list, cache, index } = props;
  const { involvedObject: obj, source, message, reason, series, reportingComponent } = event;

  const tooltipMsg = `${reason} (${obj.kind})`;
  const isWarning = typeFilter('warning', event);
  const firstTime = getFirstTime(event);
  const lastTime = getLastTime(event);
  const count = series ? series.count : event.count;

  // Events in v1beta1 apiVersion store the information about the reporting component
  // in the 'source.component' field. Events in v1 apiVersion are storing the information
  // in the `reportingComponent` field.
  // Unfortunatelly we cannot determine which field to use based on the apiVersion since
  // v1beta1 is internally converted to v1.
  const component = source.component ? source.component : reportingComponent;

  return (
    <div
      className={classNames('co-sysevent', {
        'co-sysevent--warning': isWarning,
      })}
      data-test={isWarning ? 'event-warning' : 'event'}
    >
      <div className="co-sysevent__icon-box">
        <i className="co-sysevent-icon" title={tooltipMsg} />
        <div className="co-sysevent__icon-line" />
      </div>
      <div className="co-sysevent__box" role="gridcell">
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
              {component !== 'kubelet' &&
                t('public~Generated from {{ sourceComponent }}', {
                  sourceComponent: component,
                })}
              {component === 'kubelet' && flags[FLAGS.CAN_LIST_NODE] && (
                <Trans ns="public">
                  Generated from {{ sourceComponent: component }} on{' '}
                  <Link to={resourcePathFromModel(NodeModel, source.host)}>
                    {{ sourceHost: source.host }}
                  </Link>
                </Trans>
              )}
              {component === 'kubelet' &&
                !flags[FLAGS.CAN_LIST_NODE] &&
                t('public~Generated from {{ sourceComponent }} on {{ sourceHost }}', {
                  sourceComponent: component,
                  sourceHost: source.host,
                })}
            </small>
            <div className="co-sysevent__count-and-actions">
              {count > 1 && firstTime && (
                <Trans ns="public">
                  <small className="co-sysevent__count text-secondary">
                    {{ eventCount: count }} times in the last{' '}
                    <Timestamp timestamp={firstTime} simple={true} omitSuffix={true} />
                  </small>
                </Trans>
              )}
              {count > 1 && !firstTime && (
                <Trans ns="public">
                  <small className="co-sysevent__count text-secondary">
                    {{ eventCount: count }} times
                  </small>
                </Trans>
              )}
              <ActionServiceProvider context={{ [referenceFor(event)]: event }}>
                {({ actions, options, loaded }) =>
                  loaded &&
                  actions.length > 0 && (
                    <Actions
                      actions={actions}
                      options={options}
                      list={list}
                      cache={cache}
                      index={index}
                    />
                  )
                }
              </ActionServiceProvider>
            </div>
          </div>
        </div>
        <div className="co-sysevent__message">{message}</div>
      </div>
    </div>
  );
});

export const EventsList = (props) => {
  const { t } = useTranslation();
  const [type, setType] = React.useState('all');
  const [textFilter, setTextFilter] = React.useState('');
  const { ns } = useParams();
  const [selected, setSelected] = React.useState(new Set([]));
  const eventTypes = {
    all: t('public~All types'),
    normal: t('public~Normal'),
    warning: t('public~Warning'),
  };

  const toggleSelected = (selection) => {
    setSelected((prev) => {
      const updateItems = new Set(prev);
      updateItems.has(selection) ? updateItems.delete(selection) : updateItems.add(selection);
      return updateItems;
    });
  };

  const removeResource = (selection) => {
    setSelected((prev) => {
      const updateItems = new Set(prev);
      updateItems.delete(selection);
      return updateItems;
    });
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  return (
    <>
      <PageHeading detail={true} title={props.title}>
        <div className="co-search-group">
          <ResourceListDropdown
            onChange={toggleSelected}
            selected={Array.from(selected)}
            clearSelection={clearSelection}
            className="co-search-group__resource"
          />
          <Dropdown
            className="co-search-group__resource"
            items={eventTypes}
            onChange={(v) => setType(v)}
            selectedKey={type}
            title={t('public~All types')}
          />
          <TextFilter
            autoFocus={props.autoFocus}
            label={t('public~Events by name or message')}
            onChange={(_event, val) => setTextFilter(val || '')}
          />
        </div>
        <div className="form-group">
          {selected.size > 0 && (
            <ChipGroup
              key="resources-category"
              categoryName={t('public~Resource')}
              defaultIsOpen={false}
              collapsedText={t('public~{{numRemaining}} more', { numRemaining: '${remaining}' })}
              expandedText={t('public~Show less')}
            >
              {[...selected].map((chip) => {
                return (
                  <Chip key={chip} onClick={() => removeResource(chip)}>
                    <ResourceIcon kind={chip} />
                    {kindForReference(chip)}
                  </Chip>
                );
              })}
              <CloseButton onClick={clearSelection} />
            </ChipGroup>
          )}
        </div>
      </PageHeading>
      <EventStream
        {...props}
        namespace={ns}
        key={[...selected].join(',')}
        type={type}
        kind={[...selected].join(',')}
        mock={props.mock}
        textFilter={textFilter}
      />
    </>
  );
};

export const NoEvents = () => {
  const { t } = useTranslation();
  return (
    <Box className="co-sysevent-stream__status-box-empty">
      <div className="pf-v5-u-text-align-center cos-status-box__detail">
        {t('public~No events')}
      </div>
    </Box>
  );
};

export const NoMatchingEvents = ({ allCount }) => {
  const { t } = useTranslation();
  return (
    <Box className="co-sysevent-stream__status-box-empty">
      <div className="cos-status-box__title">{t('public~No matching events')}</div>
      <div className="pf-v5-u-text-align-center cos-status-box__detail">
        {allCount >= maxMessages
          ? t('public~{{count}}+ event exist, but none match the current filter', {
              count: maxMessages,
            })
          : t('public~{{count}} event exist, but none match the current filter', {
              count: allCount,
            })}
      </div>
    </Box>
  );
};

export const ErrorLoadingEvents = () => {
  const { t } = useTranslation();
  return (
    <Box>
      <div className="cos-status-box__title cos-error-title">
        {t('public~Error loading events')}
      </div>
      <div className="cos-status-box__detail pf-v5-u-text-align-center">
        {t('public~An error occurred during event retrieval. Attempting to reconnect...')}
      </div>
    </Box>
  );
};

export const EventStreamPage = withStartGuide(({ noProjectsAvailable, ...rest }) => {
  const { t } = useTranslation();
  const title = t('public~Events');
  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <EventsList
        {...rest}
        autoFocus={!noProjectsAvailable}
        mock={noProjectsAvailable}
        title={title}
      />
    </>
  );
});

const EventStream = ({
  namespace,
  fieldSelector,
  mock,
  resourceEventStream,
  kind,
  type,
  filter,
  textFilter,
}) => {
  const { t } = useTranslation();
  const [active, setActive] = React.useState(true);
  const [sortedEvents, setSortedEvents] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const ws = React.useRef(null);

  const filteredEvents = React.useMemo(() => {
    return filterEvents(sortedEvents, { kind, type, filter, textFilter }).slice(0, maxMessages);
  }, [sortedEvents, kind, type, filter, textFilter]);

  // Handle websocket setup and teardown when dependent props change
  React.useEffect(() => {
    ws.current?.destroy();
    if (!mock) {
      const webSocketID = `${namespace || 'all'}-sysevents`;
      const watchURLOptions = {
        ...(namespace ? { ns: namespace } : {}),
        ...(fieldSelector
          ? {
              queryParams: {
                fieldSelector: encodeURIComponent(fieldSelector),
              },
            }
          : {}),
      };
      const path = watchURL(EventModel, watchURLOptions);
      const webSocketOptions = {
        host: 'auto',
        reconnect: true,
        path,
        jsonParse: true,
        bufferFlushInterval: flushInterval,
        bufferMax: maxMessages,
      };

      ws.current = new WSFactory(webSocketID, webSocketOptions)
        .onbulkmessage((messages) => {
          // Make one update to state per batch of events.
          setSortedEvents((currentSortedEvents) => {
            const topEvents = currentSortedEvents.slice(0, maxMessages);
            const batch = messages.reduce((acc, { object, type: eventType }) => {
              const uid = object.metadata.uid;
              switch (eventType) {
                case 'ADDED':
                case 'MODIFIED':
                  if (acc[uid] && acc[uid].count > object.count) {
                    // We already have a more recent version of this message stored, so skip this one
                    return acc;
                  }
                  return { ...acc, [uid]: object };
                case 'DELETED':
                  return _.omit(acc, uid);
                default:
                  // eslint-disable-next-line no-console
                  console.error(`UNHANDLED EVENT: ${eventType}`);
                  return acc;
              }
            }, _.keyBy(topEvents, 'metadata.uid'));
            return sortEvents(batch);
          });
        })
        .onopen(() => {
          setError(false);
          setLoading(false);
        })
        .onclose((evt) => {
          if (evt?.wasClean === false) {
            setError(evt.reason || t('public~Connection did not close cleanly.'));
          }
        })
        .onerror(() => {
          setError(true);
        });
    }
    return () => {
      ws.current?.destroy();
    };
  }, [namespace, fieldSelector, mock, t]);

  // Pause/unpause the websocket when the active state changes
  React.useEffect(() => {
    if (active) {
      ws.current?.unpause();
    } else {
      ws.current?.pause();
    }
  }, [active]);

  const toggleStream = () => {
    setActive((prev) => !prev);
  };

  const count = filteredEvents.length;
  const allCount = sortedEvents.length;
  const noEvents = allCount === 0;
  const noMatches = allCount > 0 && count === 0;
  let sysEventStatus, statusBtnTxt;

  if (noEvents || mock || (noMatches && resourceEventStream)) {
    sysEventStatus = <NoEvents />;
  }
  if (noMatches && !resourceEventStream) {
    sysEventStatus = <NoMatchingEvents allCount={allCount} />;
  }

  if (error) {
    statusBtnTxt = (
      <span className="co-sysevent-stream__connection-error">
        {_.isString(error)
          ? t('public~Error connecting to event stream: { error }', {
              error,
            })
          : t('public~Error connecting to event stream')}
      </span>
    );
    sysEventStatus = <ErrorLoadingEvents />;
  } else if (loading) {
    statusBtnTxt = <span>{t('public~Loading events...')}</span>;
    sysEventStatus = <Loading />;
  } else if (active) {
    statusBtnTxt = <span>{t('public~Streaming events...')}</span>;
  } else {
    statusBtnTxt = <span>{t('public~Event stream is paused.')}</span>;
  }

  const klass = classNames('co-sysevent-stream__timeline', {
    'co-sysevent-stream__timeline--empty': !allCount || !count,
  });
  const messageCount =
    count < maxMessages
      ? t('public~Showing {{count}} event', { count })
      : t('public~Showing most recent {{count}} event', { count });

  return (
    <div className="co-m-pane__body">
      <div className="co-sysevent-stream">
        <div className="co-sysevent-stream__status">
          <div className="co-sysevent-stream__timeline__btn-text">{statusBtnTxt}</div>
          <div className="co-sysevent-stream__totals text-secondary" data-test="event-totals">
            {messageCount}
          </div>
        </div>

        <div className={klass}>
          <TogglePlay
            active={active}
            onClick={toggleStream}
            className="co-sysevent-stream__timeline__btn"
          />
          <div className="co-sysevent-stream__timeline__end-message">
            {t('public~Older events are not stored.')}
          </div>
        </div>
        {count > 0 && <EventStreamList events={filteredEvents} EventComponent={Inner} />}
        {sysEventStatus}
      </div>
    </div>
  );
};

EventStream.defaultProps = {
  type: 'all',
  kind: '',
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

const filterEvents = (messages, { kind, type, filter, textFilter }) => {
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
    if (filter && !filter.some((flt) => flt(obj.involvedObject, obj))) {
      return false;
    }
    if (!textMatches(obj)) {
      return false;
    }
    return true;
  };

  return _.filter(messages, f);
};

export const ResourceEventStream_ = ({
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

export { ResourceEventStream_ as ResourceEventStream };

export const ResourcesEventStream = ({ filters, namespace }) => (
  <EventStream filter={filters} resourceEventStream namespace={namespace} />
);

/**
 * @typedef {import('@console/dynamic-plugin-sdk/src/extensions').ResourceEventStreamProps} ResourceEventStreamProps
 * @augments React.FC<ResourceEventStreamProps>
 */
export const WrappedResourceEventStream = ({ resource }) => <ResourceEventStream_ obj={resource} />;

export default ResourceEventStream_;
