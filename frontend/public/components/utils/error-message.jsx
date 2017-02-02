import React from 'react';

export const ErrorMessage = ({errorMessage}) => {
  if (!errorMessage) {
    return null;
  }
  return <div className="co-m-message co-m-message--error">{errorMessage}</div>;
};

ErrorMessage.propTypes = {
  errorMessage: React.PropTypes.string.isRequired,
};
