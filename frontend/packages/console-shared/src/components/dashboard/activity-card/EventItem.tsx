import * as React from 'react';
import { AccordionContent, AccordionItem, AccordionToggle } from '@patternfly/react-core';
import classNames from 'classnames';
import { RedExclamationCircleIcon } from '@console/shared';
import { categoryFilter } from '@console/internal/components/events';
import { twentyFourHourTime } from '@console/internal/components/utils/datetime';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { EventKind, referenceFor } from '@console/internal/module/k8s';

const propsAreEqual = (prevProps: EventItemProps, nextProps: EventItemProps) =>
  prevProps.event.metadata.uid === nextProps.event.metadata.uid &&
  prevProps.event.lastTimestamp === nextProps.event.lastTimestamp &&
  prevProps.isExpanded === nextProps.isExpanded &&
  prevProps.onToggle === nextProps.onToggle;

const EventItem: React.FC<EventItemProps> = React.memo(({ event, isExpanded, onToggle }) => {
  const { lastTimestamp, involvedObject, message, reason, metadata } = event;
  const isError = categoryFilter('error', { reason });
  const expanded = isExpanded(metadata.uid);
  return (
    <div className="co-recent-item__body">
      <AccordionItem>
        <AccordionToggle
          onClick={() => onToggle(metadata.uid)}
          isExpanded={expanded}
          id={metadata.uid}
          className={classNames('co-recent-item__toggle', {
            'co-recent-item--error': isError && expanded,
          })}
        >
          <div className="co-recent-item__title">
            <div className="co-recent-item__title-timestamp text-secondary">
              {lastTimestamp ? twentyFourHourTime(new Date(lastTimestamp)) : '-'}
            </div>
            <div className="co-recent-item__title-message">
              {isError && (
                <RedExclamationCircleIcon className="co-dashboard-icon co-recent-item__icon--error" />
              )}
              {!expanded && (
                <>
                  <ResourceIcon kind={involvedObject.kind} />
                  <div className="co-recent-item__title-message-text">{message}</div>
                </>
              )}
            </div>
          </div>
        </AccordionToggle>
        <AccordionContent
          isHidden={!expanded}
          className={classNames('co-recent-item__content', { 'co-recent-item--error': isError })}
        >
          <div>
            <div className="co-recent-item__content-header">
              <ResourceLink
                className="co-recent-item__content-resourcelink"
                kind={referenceFor(involvedObject)}
                namespace={involvedObject.namespace}
                name={involvedObject.name}
                title={involvedObject.uid}
              />
            </div>
            <div className="co-dashboard-text--small co-recent-item__content-message">
              {message}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}, propsAreEqual);

export default EventItem;

type EventItemProps = {
  event: EventKind;
  isExpanded: (key: string) => boolean;
  onToggle: (key: string) => void;
};
