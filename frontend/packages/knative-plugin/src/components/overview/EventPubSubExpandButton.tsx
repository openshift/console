import type { FC } from 'react';
import { Button } from '@patternfly/react-core';
import { RhUiCaretDownIcon, RhUiCaretRightIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import './EventPubSubExpandButton.scss';

type EventPubSubExpandButtonProps = {
  onClick: () => void;
  rowSelected: boolean;
};

const EventPubSubExpandButton: FC<EventPubSubExpandButtonProps> = ({ rowSelected, onClick }) => {
  const { t } = useTranslation('knative-plugin');
  const title = rowSelected ? t('Hide filters') : t('Show filters');
  return (
    <Button
      icon={
        <>
          <span className="kn-event-pubsub-expand-button__link">{title}</span>
          {rowSelected ? (
            <RhUiCaretDownIcon className="kn-event-pubsub-expand-button__icon" />
          ) : (
            <RhUiCaretRightIcon className="kn-event-pubsub-expand-button__icon" />
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
