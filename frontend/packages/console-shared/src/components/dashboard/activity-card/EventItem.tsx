import * as React from 'react';
import { AccordionContent, AccordionItem, AccordionToggle } from '@patternfly/react-core';
import classNames from 'classnames';
import { typeFilter, getLastTime } from '@console/internal/components/events';
import { twentyFourHourTime } from '@console/internal/components/utils/datetime';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { EventKind, referenceFor } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '../../status';
import { useTranslation } from 'react-i18next';

const propsAreEqual = (prevProps: EventItemProps, nextProps: EventItemProps) =>
  prevProps.event.metadata.uid === nextProps.event.metadata.uid &&
  getLastTime(prevProps.event) === getLastTime(nextProps.event) &&
  prevProps.isExpanded === nextProps.isExpanded &&
  prevProps.onToggle === nextProps.onToggle;

const EventItem: React.FC<EventItemProps> = React.memo(({ event, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  const { involvedObject, message, metadata } = event;
  const lastTime = getLastTime(event);
  const isWarning = typeFilter('warning', event);
  const expanded = isExpanded(metadata.uid);
  return (
    <div className="co-recent-item__body">
      <AccordionItem>
        <AccordionToggle
          onClick={() => onToggle(metadata.uid)}
          isExpanded={expanded}
          id={metadata.uid}
          className={classNames('co-recent-item__toggle', {
            'co-recent-item--warning': isWarning && expanded,
          })}
        >
          <div className="co-recent-item__title">
            <div className="co-recent-item__title-timestamp text-secondary">
              {lastTime ? (
                <span title={lastTime}>{twentyFourHourTime(new Date(lastTime))}</span>
              ) : (
                '-'
              )}
            </div>
            <div className="co-recent-item__title-message">
              {isWarning && (
                <YellowExclamationTriangleIcon
                  title={t('public~Warning')}
                  className="co-dashboard-icon co-recent-item__icon--warning"
                />
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
          className={classNames('co-recent-item__content', {
            'co-recent-item--warning': isWarning,
          })}
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
