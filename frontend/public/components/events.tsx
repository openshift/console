import * as _ from 'lodash';
import type { ComponentType, FC, ReactNode } from 'react';
import { useEffect, useState, useMemo } from 'react';
import { css } from '@patternfly/react-styles';
import { Link, useParams } from 'react-router-dom-v5-compat';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import {
  Label,
  LabelGroup,
  Button,
  ButtonSize,
  ButtonVariant,
  PageSection,
  Toolbar,
  ToolbarItem,
  ToolbarContent,
} from '@patternfly/react-core';

import { Trans, useTranslation } from 'react-i18next';
import type { Action, MenuOption } from '@console/dynamic-plugin-sdk';

import { ResourceListDropdown } from './resource-dropdown';
import { TextFilter } from './factory/text-filter';
import {
  apiGroupForReference,
  isGroupVersionKind,
  kindForReference,
  referenceFor,
} from '../module/k8s';
import { withStartGuide } from './start-guide';
import { EventModel, NodeModel } from '../models';
import { useK8sWatchResource } from './utils/k8s-watch-hook';
import { useFlag } from '@console/shared/src/hooks/flag';
import { FLAGS } from '@console/shared/src/constants/common';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { Loading, ConsoleEmptyState } from './utils/status-box';
import { ResourceIcon } from './utils/resource-icon';
import { ResourceLink, resourcePathFromModel } from './utils/resource-link';
import { TogglePlay } from './utils/toggle-play';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { EventStreamList, EventComponentProps } from './utils/event-stream';
import ActionMenu from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import ActionServiceProvider from '@console/shared/src/components/actions/ActionServiceProvider';
import ActionMenuItem from '@console/shared/src/components/actions/menu/ActionMenuItem';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import type { EventKind } from '../module/k8s/types';
import type { EventInvolvedObject } from '../module/k8s/event';
import type { CellMeasurerCache } from 'react-virtualized';
import type {
  K8sResourceCommon,
  ResourceEventStreamProps,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';

const maxMessages = 500;

// Extended EventKind type to include reportingComponent field present in v1 events
interface ExtendedEventKind extends EventKind {
  reportingComponent?: string;
}

// Types
interface ActionsProps {
  actions: Action[];
  options?: MenuOption[];
  list?: EventComponentProps['list'];
  cache: CellMeasurerCache;
  index: number;
}

interface InnerProps extends Omit<EventComponentProps, 'event'> {
  event: ExtendedEventKind;
}

interface EventsListProps {
  title?: string;
  autoFocus?: boolean;
  mock?: boolean;
}

interface NoMatchingEventsProps {
  allCount: number;
}

type FilterFunction = (involvedObject: EventInvolvedObject, event: EventKind) => boolean;

interface EventStreamProps {
  namespace?: string;
  fieldSelector?: string;
  mock?: boolean;
  resourceEventStream?: boolean;
  kind?: string;
  type?: string;
  filter?: FilterFunction[];
  textFilter?: string;
}

interface InternalResourceEventStreamProps {
  obj: K8sResourceCommon;
}

interface InternalResourcesEventStreamProps {
  filters: FilterFunction[];
  namespace?: string;
}

// We have to check different properties depending on whether events were
// created with the core/v1 events API or the new events.k8s.io API.
const getFirstTime = (event: EventKind): string | undefined =>
  event.firstTimestamp || event.eventTime;

export const getLastTime = (event: EventKind): string | null | undefined => {
  const lastObservedTime = event.series ? event.series.lastObservedTime : null;
  return event.lastTimestamp || lastObservedTime || event.eventTime;
};

export const sortEvents = (events: EventKind[] | Record<string, EventKind>): EventKind[] => {
  return _.orderBy(
    events,
    [getLastTime, getFirstTime, 'name'],
    ['desc', 'desc', 'asc'],
  ) as EventKind[];
};

// Predicate function to filter by event "type" (normal, warning, or all)
export const typeFilter = (eventType: string, event: EventKind): boolean => {
  if (eventType === 'all') {
    return true;
  }
  const { type = 'normal' } = event;
  return type.toLowerCase() === eventType;
};

const kindFilter = (reference: string, { involvedObject }: EventKind): boolean => {
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

const Actions: FC<ActionsProps> = ({ actions, options, list, cache, index }) => {
  useEffect(() => {
    // Actions contents will render after the initial row height calculation,
    // so recompute the row height.
    cache.clear(index, 0);
    list?.recomputeRowHeights(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="co-sysevent__actions">
      {actions.length === 1 ? (
        <ActionMenuItem
          action={actions[0]}
          component={(props: any) => (
            // Button is not compatible with DropdownItem but it is close enough to work
            <Button variant={ButtonVariant.secondary} size={ButtonSize.sm} {...props} />
          )}
        />
      ) : (
        <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
      )}
    </div>
  );
};

const Inner: FC<InnerProps> = ({ event, list, cache, index }) => {
  const { t } = useTranslation('public');
  const canListNode = useFlag(FLAGS.CAN_LIST_NODE);
  const { involvedObject: obj, source, message, reason, series, reportingComponent } = event;

  const tooltipMsg = `${reason} (${obj.kind})`;
  const isWarning = typeFilter('warning', event);
  const firstTime = getFirstTime(event);
  const lastTime = getLastTime(event);
  const count = series ? series.count : event.count;

  // Events in v1beta1 apiVersion store the information about the reporting component
  // in the 'source.component' field. Events in v1 apiVersion are storing the information
  // in the `reportingComponent` field.
  // Unfortunately we cannot determine which field to use based on the apiVersion since
  // v1beta1 is internally converted to v1.
  const component = source.component ? source.component : reportingComponent;

  return (
    <div
      className={css('co-sysevent', {
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
                className="co-sysevent__resourcelink pf-v6-u-display-none pf-v6-u-display-block-on-sm"
                kind="Namespace"
                name={obj.namespace}
              />
            )}
            {lastTime && <Timestamp className="co-sysevent__timestamp" timestamp={lastTime} />}
          </div>
          <div className="co-sysevent__details">
            <span className="pf-v6-u-font-size-xs co-sysevent__source">
              {component !== 'kubelet' &&
                t('Generated from {{ sourceComponent }}', {
                  sourceComponent: component,
                })}
              {component === 'kubelet' && canListNode && (
                <Trans ns="public">
                  Generated from {{ sourceComponent: component }} on{' '}
                  <Link to={resourcePathFromModel(NodeModel, source.host)}>
                    {{ sourceHost: source.host }}
                  </Link>
                </Trans>
              )}
              {component === 'kubelet' &&
                !canListNode &&
                t('Generated from {{ sourceComponent }} on {{ sourceHost }}', {
                  sourceComponent: component,
                  sourceHost: source.host,
                })}
            </span>
            <div className="co-sysevent__count-and-actions">
              {count > 1 && firstTime && (
                <Trans ns="public">
                  <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle co-sysevent__count">
                    {{ eventCount: count }} times in the last{' '}
                    <Timestamp timestamp={firstTime} simple={true} omitSuffix={true} />
                  </span>
                </Trans>
              )}
              {count > 1 && !firstTime && (
                <Trans ns="public">
                  <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle co-sysevent__count">
                    {{ eventCount: count }} times
                  </span>
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
};

export const NoEvents: FC = () => {
  const { t } = useTranslation('public');
  return <ConsoleEmptyState>{t('No events')}</ConsoleEmptyState>;
};

export const NoMatchingEvents: FC<NoMatchingEventsProps> = ({ allCount }) => {
  const { t } = useTranslation('public');
  return (
    <ConsoleEmptyState title={t('No matching events')}>
      {allCount >= maxMessages
        ? t('{{count}}+ event exist, but none match the current filter', {
            count: maxMessages,
          })
        : t('{{count}} event exist, but none match the current filter', {
            count: allCount,
          })}
    </ConsoleEmptyState>
  );
};

export const ErrorLoadingEvents: FC = () => {
  const { t } = useTranslation('public');
  return (
    <ConsoleEmptyState title={t('Error loading events')}>
      {t('An error occurred while retrieving events. Attempting to reconnect...')}
    </ConsoleEmptyState>
  );
};

interface FilterEventsOptions {
  kind?: string;
  type?: string;
  filter?: FilterFunction[];
  textFilter?: string;
}

const filterEvents = (
  messages: EventKind[],
  { kind, type, filter, textFilter }: FilterEventsOptions,
): EventKind[] => {
  // Don't use `fuzzy` because it results in some surprising matches in long event messages.
  // Instead perform an exact substring match on each word in the text filter.
  const words = _.uniq(_.toLower(textFilter).match(/\S+/g) ?? []).sort((a, b) => {
    // Sort the longest words first.
    return b.length - a.length;
  });

  const textMatches = (obj: EventKind): boolean => {
    if (_.isEmpty(words)) {
      return true;
    }
    const name = _.get(obj, 'involvedObject.name', '');
    const message = _.toLower(obj.message);
    return words.every((word) => name.indexOf(word) !== -1 || message.indexOf(word) !== -1);
  };

  const f = (obj: EventKind): boolean => {
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

const EventStream: FC<EventStreamProps> = ({
  namespace,
  fieldSelector,
  mock = false,
  resourceEventStream,
  kind = '',
  type = 'all',
  filter,
  textFilter,
}) => {
  const { t } = useTranslation('public');
  const [active, setActive] = useState(true);

  const [pausedSnapshot, setPausedSnapshot] = useState<EventKind[] | null>(null);

  const [eventsData, eventsLoaded, eventsLoadError] = useK8sWatchResource<EventKind[]>(
    !mock && active
      ? {
          isList: true,
          kind: EventModel.kind,
          namespace,
          fieldSelector,
        }
      : null,
  );

  const sortedEvents = useMemo(() => {
    // If paused, use snapshot, else use live data
    const dataSource = pausedSnapshot ?? eventsData;
    if (!dataSource) {
      return [];
    }
    return sortEvents(dataSource).slice(0, maxMessages);
  }, [pausedSnapshot, eventsData]);

  const filteredEvents = useMemo(() => {
    return filterEvents(sortedEvents, { kind, type, filter, textFilter }).slice(0, maxMessages);
  }, [sortedEvents, kind, type, filter, textFilter]);

  const toggleStream = () => {
    setActive((prev) => {
      const newActive = !prev;
      if (!newActive) {
        setPausedSnapshot(eventsData ?? []);
      } else {
        setPausedSnapshot(null);
      }
      return newActive;
    });
  };

  const count = filteredEvents.length;
  const allCount = sortedEvents.length;
  const noEvents = allCount === 0;
  const noMatches = allCount > 0 && count === 0;
  let sysEventStatus: ReactNode;
  let statusBtnTxt: ReactNode;

  if (noEvents || mock || (noMatches && resourceEventStream)) {
    sysEventStatus = <NoEvents />;
  }
  if (noMatches && !resourceEventStream) {
    sysEventStatus = <NoMatchingEvents allCount={allCount} />;
  }

  if (eventsLoadError) {
    statusBtnTxt = (
      <span className="co-sysevent-stream__connection-error">
        {typeof eventsLoadError === 'string'
          ? t('Error connecting to event stream: {{ error }}', {
              error: eventsLoadError,
            })
          : t('Error connecting to event stream')}
      </span>
    );
    sysEventStatus = <ErrorLoadingEvents />;
  } else if (!eventsLoaded) {
    statusBtnTxt = <span>{t('Loading events...')}</span>;
    sysEventStatus = <Loading />;
  } else if (active) {
    statusBtnTxt = <span>{t('Streaming events...')}</span>;
  } else {
    statusBtnTxt = <span>{t('Event stream is paused.')}</span>;
  }

  const klass = css('co-sysevent-stream__timeline', {
    'co-sysevent-stream__timeline--empty': !allCount || !count,
  });
  const messageCount =
    count < maxMessages
      ? t('Showing {{count}} event', { count })
      : t('Showing most recent {{count}} event', { count });

  return (
    <PaneBody>
      <div className="co-sysevent-stream">
        <div className="co-sysevent-stream__status">
          <div className="co-sysevent-stream__timeline__btn-text">{statusBtnTxt}</div>
          <div
            className="co-sysevent-stream__totals pf-v6-u-text-color-subtle"
            data-test="event-totals"
          >
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
            {t('Older events are not stored.')}
          </div>
        </div>
        {count > 0 && (
          <EventStreamList
            events={filteredEvents}
            EventComponent={Inner as ComponentType<EventComponentProps>}
          />
        )}
        {sysEventStatus}
      </div>
    </PaneBody>
  );
};

export const EventsList: FC<EventsListProps> = (props) => {
  const { t } = useTranslation('public');
  const [type, setType] = useState('all');
  const [textFilter, setTextFilter] = useState('');
  const { ns } = useParams<{ ns?: string }>();
  const [selected, setSelected] = useState<Set<string>>(new Set([]));
  const eventTypes = {
    all: t('All types'),
    normal: t('Normal'),
    warning: t('Warning'),
  };

  const toggleSelected = (selection: string) => {
    setSelected((prev) => {
      const updateItems = new Set(prev);
      updateItems.has(selection) ? updateItems.delete(selection) : updateItems.add(selection);
      return updateItems;
    });
  };

  const removeResource = (selection: string) => {
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
      <PageHeading title={props.title} />
      <PageSection>
        <Toolbar id="toolbar-component-managed-toggle-groups">
          <ToolbarContent>
            <ResourceListDropdown onChange={toggleSelected} selected={Array.from(selected)} />
            <ToolbarItem>
              <ConsoleSelect
                items={eventTypes}
                onChange={(v) => setType(v)}
                selectedKey={type}
                title={t('All types')}
              />
            </ToolbarItem>
            <ToolbarItem className="pf-v6-u-w-100 pf-v6-u-w-50-on-sm pf-v6-u-w-25-on-xl">
              <TextFilter
                autoFocus={props.autoFocus}
                label={t('Events by name or message')}
                onChange={(_event, val) => setTextFilter(val || '')}
              />
            </ToolbarItem>
          </ToolbarContent>
          {selected.size > 0 && (
            <ToolbarContent>
              <LabelGroup
                key="resources-category"
                categoryName={t('Resource')}
                defaultIsOpen={false}
                collapsedText={t('{{numRemaining}} more', {
                  numRemaining: '${remaining}',
                })}
                expandedText={t('Show less')}
                isClosable
                onClick={clearSelection}
              >
                {[...selected].map((chip) => {
                  return (
                    <Label variant="outline" key={chip} onClose={() => removeResource(chip)}>
                      <ResourceIcon kind={chip} />
                      {kindForReference(chip)}
                    </Label>
                  );
                })}
              </LabelGroup>
            </ToolbarContent>
          )}
        </Toolbar>
      </PageSection>
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

export const EventStreamPage = withStartGuide(
  ({ noProjectsAvailable, ...rest }: { noProjectsAvailable?: boolean } & EventsListProps) => {
    const { t } = useTranslation('public');
    const title = t('Events');
    return (
      <>
        <DocumentTitle>{title}</DocumentTitle>
        <EventsList
          {...rest}
          autoFocus={!noProjectsAvailable}
          mock={noProjectsAvailable}
          title={title}
        />
      </>
    );
  },
);

export const ResourceEventStream_: FC<InternalResourceEventStreamProps> = ({
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

export const ResourcesEventStream: FC<InternalResourcesEventStreamProps> = ({
  filters,
  namespace,
}) => <EventStream filter={filters} resourceEventStream namespace={namespace} />;

export const WrappedResourceEventStream: FC<ResourceEventStreamProps> = ({ resource }) => (
  <ResourceEventStream_ obj={resource} />
);

export default ResourceEventStream_;
