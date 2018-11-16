import * as React from 'react';
import PropTypes from 'prop-types';

import { errorModal } from '../okdcomponents';
import { Alert } from 'patternfly-react';

const safeString = (x) => typeof x === 'string' ? x : JSON.stringify(x);

const Errors = ({ errors }) => {
  let content;
  if (errors.length === 1) {
    content =safeString(errors[0]);
  } else {
    content = (
      <ul>
        {errors.map((error, idx) => <li key={idx}>{safeString(error)}</li>)}
      </ul>
    );
  }

  return (
    <Alert>
      {content}
    </Alert>
  );
};

Errors.propTypes = {
  errors: PropTypes.array.isRequired,
};

export const showErrors = (errors) => {
  if (errors && errors.length > 0) {
    errorModal({
      error: (<Errors errors={errors} />),
    });
  }
};

export const showError = (error) => {
  showErrors([error]);
};
