import React from 'react';

export default ({timestamp}) => {
  const date = new Date(timestamp);
  const mdate = moment(date);
  let invalidDate = false;
  if (!mdate.isValid()) {
    invalidDate = true;
  }
  return (
    <div>
      <i className="fa fa-globe" />
      &nbsp;
      <div className="co-timestamp">
        {invalidDate ? '-' : mdate.utc().format('MMM DD, H:mm A z')}
      </div>
    </div>
  );
}
