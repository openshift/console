import React from 'react';

export const Timestamp = ({timestamp}) => {
  const date = new Date(timestamp);
  const mdate = moment(date);
  let invalidDate = false;
  if (!mdate.isValid()) {
    invalidDate = true;
  }

  return (
    <div>
      {invalidDate ? '' : <i className="fa fa-globe" />}
      <div className="co-timestamp">
        {invalidDate ? '-' : '\u00a0' +  mdate.utc().format('MMM DD, H:mm A z')}
      </div>
    </div>
  );
}
