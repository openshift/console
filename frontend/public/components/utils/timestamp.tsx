import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { Tooltip } from '@patternfly/react-core';
import * as classNames from 'classnames';
import { GlobeAmericasIcon } from '@patternfly/react-icons';
import { TimestampProps } from '@console/dynamic-plugin-sdk';

import * as dateTime from './datetime';

const timestampFor = (mdate: Date, now: Date, omitSuffix: boolean) => {
  if (!dateTime.isValid(mdate)) {
    return '-';
  }

  const timeDifference = now.getTime() - mdate.getTime();
  if (omitSuffix) {
    return dateTime.fromNow(mdate, undefined, { omitSuffix: true });
  }

  // Show a relative time if within 10.5 minutes in the past from the current time.
  if (timeDifference > dateTime.maxClockSkewMS && timeDifference < 630000) {
    return dateTime.fromNow(mdate);
  }

  // Apr 23, 2021, 4:33 PM
  return dateTime.dateTimeFormatter.format(mdate);
};

const nowStateToProps = ({ UI }) => ({ now: UI.get('lastTick') });

export const Timestamp = (props: TimestampProps) => {
  const now = useSelector(nowStateToProps);
  // Check for null. If props.timestamp is null, it returns incorrect date and time of Wed Dec 31 1969 19:00:00 GMT-0500 (Eastern Standard Time)
  if (!props.timestamp) {
    return <div className="co-timestamp">-</div>;
  }

  const mdate = new Date(props.timestamp);

  const timestamp = timestampFor(mdate, new Date(now), props.omitSuffix);

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
