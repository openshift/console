import * as React from 'react';
import { connect } from 'react-redux';
import { Tooltip } from '@patternfly/react-core';
import * as classNames from 'classnames';
// import { GlobeAmericasIcon } from '@patternfly/react-icons';

// import * as dateTime from './datetime';

// MEMO: hypercloud timestamp 기획 변경으로 기존 timestamp 부분 주석처리 해놓음

// const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// const timestampFor = (mdate: Date, now: Date, omitSuffix: boolean) => {
//   if (!dateTime.isValid(mdate)) {
//     return '-';
//   }

//   const timeDifference = now.getTime() - mdate.getTime();
//   if (omitSuffix) {
//     return dateTime.fromNow(mdate, undefined, { omitSuffix: true });
//   }
//   if (Math.sign(timeDifference) !== -1 && timeDifference < 630000) {
//     // 10.5 minutes
//     // Show a relative time if within 10.5 minutes in the past from the current time.
//     return dateTime.fromNow(mdate);
//   }

//   let a = 'am';
//   let hours = mdate.getHours();
//   if (hours > 12) {
//     hours -= 12;
//     a = 'pm';
//   }

//   const minuteStr = mdate
//     .getMinutes()
//     .toString()
//     .padStart(2, '00');
//   let timeStr = `${hours}:${minuteStr} ${a}`;
//   if (mdate.getFullYear() !== now.getFullYear()) {
//     timeStr = `${mdate.getFullYear()} ${timeStr}`;
//   }

//   const monthStr = monthAbbrs[mdate.getMonth()];

//   return `${monthStr} ${mdate.getDate()}, ${timeStr}`;
// };

const nowStateToProps = ({ UI }) => ({ now: UI.get('lastTick') });

// export const Timestamp = connect(nowStateToProps)((props: TimestampProps) => {
//   // Check for null. If props.timestamp is null, it returns incorrect date and time of Wed Dec 31 1969 19:00:00 GMT-0500 (Eastern Standard Time)
//   if (!props.timestamp) {
//     return <div className="co-timestamp">-</div>;
//   }
//   console.log('props.timestamp? ', props.timestamp);

//   const mdate = props.isUnix ? new Date((props.timestamp as number) * 1000) : new Date(props.timestamp);
//   console.log('mdate? ', mdate);

//   const timestamp = timestampFor(mdate, new Date(props.now), props.omitSuffix);
//   console.log('timestamp? ', timestamp);

//   if (!dateTime.isValid(mdate)) {
//     return <div className="co-timestamp">-</div>;
//   }

//   if (props.simple) {
//     return <>{timestamp}</>;
//   }

//   return (
//     <div className={classNames('co-timestamp co-icon-and-text', props.className)}>
//       <GlobeAmericasIcon className="co-icon-and-text__icon" />
//       <Tooltip
//         content={[
//           <span className="co-nowrap" key="co-timestamp">
//             {mdate.toISOString()}
//           </span>,
//         ]}
//       >
//         <span>{timestamp}</span>
//       </Tooltip>
//     </div>
//   );
// });

const formatTimeZoneStamp = timestamp => {
  const d = new Date(timestamp);
  const date: any = d.toISOString().split('T')[0];
  const time: string = d.toTimeString().split(' ')[0];

  if (!!date) {
    const formattedDate = date.replaceAll('-', '.');
    return `${formattedDate} ${time}`;
  } else {
    return timestamp;
  }
};

// MEMO: timestamp값이 utc로 들어온다는 전제로 변환 구현
const formatUtcStamp = timestamp => {
  if (typeof timestamp == 'object') {
    const d = new Date(timestamp);
    const isoTimestamp: any = d.toISOString();
    return isoTimestamp
      .replace('T', ' ')
      .replace(/-/g, '.')
      .replace('Z', ' (UTC)');
  } else if (typeof timestamp == 'string') {
    const formattedStamp = timestamp
      .replace('T', ' ')
      .replace(/-/g, '.')
      .replace('Z', ' (UTC)');
    return formattedStamp;
  } else {
    return '';
  }
};

export const Timestamp = connect(nowStateToProps)((props: TimestampProps) => {
  if (!props.timestamp) {
    return <div className="co-timestamp">-</div>;
  }

  const utcTimestamp = formatUtcStamp(props.timestamp);
  const timestamp = formatTimeZoneStamp(props.timestamp);

  return (
    <div className={classNames('co-timestamp co-icon-and-text', props.className)}>
      <Tooltip
        content={[
          <span className="co-nowrap" key="co-timestamp">
            {utcTimestamp}
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
