import { Tooltip } from '@patternfly/react-core';
import { GlobeAmericasIcon } from '@patternfly/react-icons/dist/esm/icons/globe-americas-icon';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { getLastLanguage } from '@console/app/src/components/user-preferences/language/getLastLanguage';
import { TimestampProps } from '@console/dynamic-plugin-sdk';
import { RootState } from '@console/internal/redux';
import * as dateTime from '../../utils/datetime';

export const Timestamp = (props: TimestampProps) => {
  const now = useSelector<RootState, string>(({ UI }) => UI.get('lastTick'));

  // Workaround for Date&Time values are not showing in supported languages onchange of language selector.
  const lang = getLastLanguage();

  // Check for null. If props.timestamp is null, it returns incorrect date and time of Wed Dec 31 1969 19:00:00 GMT-0500 (Eastern Standard Time)
  if (!props.timestamp) {
    return <div className="co-timestamp">-</div>;
  }

  const mdate = new Date(props.timestamp);

  const timestamp = dateTime.timestampFor(mdate, new Date(now), props.omitSuffix, lang);

  if (!dateTime.isValid(mdate)) {
    return <div className="co-timestamp">-</div>;
  }

  if (props.simple) {
    return <>{timestamp}</>;
  }

  return (
    <div className={classNames('co-timestamp co-icon-and-text', props.className)}>
      <GlobeAmericasIcon className="co-icon-and-text__icon" />
      <Tooltip
        content={[
          <span className="co-nowrap" key="co-timestamp">
            {dateTime.utcDateTimeFormatter.format(mdate)}
          </span>,
        ]}
      >
        <span data-test="timestamp">{timestamp}</span>
      </Tooltip>
    </div>
  );
};

Timestamp.displayName = 'Timestamp';
