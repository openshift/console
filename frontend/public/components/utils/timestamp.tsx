import * as React from 'react';
import { connect } from 'react-redux';
import { Tooltip } from '@patternfly/react-core';
import * as classNames from 'classnames';
import { GlobeAmericasIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import * as dateTime from './datetime';

const timestampFor = (mdate: Date, now: Date, omitSuffix: boolean, t: any) => {
  if (!dateTime.isValid(mdate)) {
    return '-';
  }

  const timeDifference = now.getTime() - mdate.getTime();
  if (omitSuffix) {
    return dateTime.fromNow(mdate, undefined, { omitSuffix: true });
  }
  if (Math.sign(timeDifference) !== -1 && timeDifference < 630000) {
    // 10.5 minutes
    // Show a relative time if within 10.5 minutes in the past from the current time.
    return dateTime.fromNow(mdate);
  }

  // Apr 23, 4:33 pm
  return t('{{date, MMM D, h:mm a}}', { date: mdate });
};

const nowStateToProps = ({ UI }) => ({ now: UI.get('lastTick') });

export const Timestamp = connect(nowStateToProps)((props: TimestampProps) => {
  // Check for null. If props.timestamp is null, it returns incorrect date and time of Wed Dec 31 1969 19:00:00 GMT-0500 (Eastern Standard Time)
  if (!props.timestamp) {
    return <div className="co-timestamp">-</div>;
  }

  const mdate = props.isUnix
    ? new Date((props.timestamp as number) * 1000)
    : new Date(props.timestamp);
  const { t } = useTranslation();
  const timestamp = timestampFor(mdate, new Date(props.now), props.omitSuffix, t);

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
            {mdate.toISOString()}
          </span>,
        ]}
      >
        <span>{timestamp}</span>
      </Tooltip>
    </div>
  );
});

export type TimestampProps = {
  timestamp: string | number;
  isUnix?: boolean;
  now: number;
  simple?: boolean;
  omitSuffix?: boolean;
  className?: string;
};

Timestamp.displayName = 'Timestamp';
