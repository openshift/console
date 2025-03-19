import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { AngleDownIcon } from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import { AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons/angle-right-icon';
import { useTranslation } from 'react-i18next';

import './EventPubSubExpandButton.scss';

type EventPubSubExpandButtonProps = {
  onClick: () => void;
  rowSelected: boolean;
};

const EventPubSubExpandButton: React.FC<EventPubSubExpandButtonProps> = ({
  rowSelected,
  onClick,
}) => {
  const { t } = useTranslation();
  const title = rowSelected ? t('knative-plugin~Hide filters') : t('knative-plugin~Show filters');
  return (
    <Button
      icon={
        <>
          <span className="kn-event-pubsub-expand-button__link">{title}</span>
          {rowSelected ? (
            <AngleDownIcon className="kn-event-pubsub-expand-button__icon" />
          ) : (
            <AngleRightIcon className="kn-event-pubsub-expand-button__icon" />
          )}
        </>
      }
      aria-label={title}
      onClick={onClick}
      title={title}
      variant="plain"
    />
  );
};

export default EventPubSubExpandButton;
