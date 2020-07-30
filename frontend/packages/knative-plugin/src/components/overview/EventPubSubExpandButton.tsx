import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons';

import './EventPubSubExpandButton.scss';

type EventPubSubExpandButtonProps = {
  onClick: () => void;
  rowSelected: boolean;
};

const EventPubSubExpandButton: React.FC<EventPubSubExpandButtonProps> = ({
  rowSelected,
  onClick,
}) => {
  const title = `${rowSelected ? 'Hide' : 'Show'} filters`;
  return (
    <Button aria-label={title} onClick={onClick} title={title} variant="plain">
      <span className="kn-event-pubsub-expand-button__link">{title}</span>
      {rowSelected ? (
        <AngleDownIcon className="kn-event-pubsub-expand-button__icon" />
      ) : (
        <AngleRightIcon className="kn-event-pubsub-expand-button__icon" />
      )}
    </Button>
  );
};

export default EventPubSubExpandButton;
