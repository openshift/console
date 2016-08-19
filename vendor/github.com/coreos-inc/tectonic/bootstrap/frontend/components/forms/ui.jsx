import classNames from 'classnames';
import { Set } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';

import { validate } from '../../modules/validate';
import { readFile } from '../../modules/readfile';

import { flagActionTypes } from '../../modules/actions';

// Use this function to dirty a field due to
// non-user interaction (like uploading a config file)
export const markIDDirty = (dispatch, id) => {
  dispatch({
    type: flagActionTypes.ADD,
    payload: {
      subject: 'SIMPLE_FIELDS',
      value: id,
    },
  });
};

const Field = connect(
  ({flags}) => {
    return {
      dirtySet: flags.SIMPLE_FIELDS || Set(),
    };
  },
  (dispatch) => {
    return {
      markDirty: (id) => {
        markIDDirty(dispatch, id);
      },
    };
  }
)((props) => {
  const tag = props.tag || 'input';
  const dirty = props.forceDirty || props.dirtySet.has(props.id);
  const fieldClasses = classNames(props.className, {
    'wiz-dirty': dirty,
    'wiz-invalid': props.invalid,
  });
  const errorClasses = classNames('wiz-validation-message', 'wiz-error-bg', {
    hidden: !(dirty && props.invalid),
  });

  const field = React.createElement(tag, Object.assign({}, props, {
    className: fieldClasses,
    autoCorrect: 'off',
    autoComplete: 'off',
    spellCheck: 'false',
    children: undefined,
    onChange: (e) => {
      if (props.onValue) {
        props.onValue(e.target.value);
      }
    },
    onBlur: (e) => {
      if (e.target.value) {
        props.markDirty(props.id);
      }
    },
  }));

  return (
    <div>
      {props.prefix}
      {field}
      {props.suffix}
      <div className={errorClasses}>
        {props.children}
      </div>
    </div>
  );
});

// component for uninteresting input[type="text"] fields.
// Handles error displays and boilerplate attributes.
// <Input id:REQUIRED invalid placeholder value onValue>
//    Error message goes here
// </Input>
export const Input = connect(
  () => {
    return {
      tag: 'input',
      type: 'text',
    };
  }
)(Field);

// Just like Input, but for password fields
export const Password = connect(
  () => {
    return {
      tag: 'input',
      type: 'password',
    };
  }
)(Field);

// A textarea/file-upload combo
// <FileArea id:REQUIRED invalid placeholder value onValue>
//    Error message goes here
// </FileArea>
export const FileArea = connect(
  () => {
    return {
      tag: 'textarea',
    };
  },
  (dispatch) => {
    return {
      markDirtyUpload: (id) => {
        markIDDirty(dispatch, id);
      },
    };
  }
)((props) => {
  const {id, onValue, markDirtyUpload} = props;
  const handleUpload = (e) => {
    readFile(e.target.files.item(0))
    .then((value) => {
      onValue(value);
    })
    .catch((msg) => {
      console.error(msg);
    })
    .then(() => {
      markDirtyUpload(id);
    });
  };

  return (
    <div>
      <label className="btn btn-sm btn-link">
        <span className="fa fa-upload"></span>&nbsp;&nbsp;Upload {' '}
        <input style={{display: 'none'}}
               type="file"
               onChange={handleUpload} />
      </label>
      <Field {...props} />
    </div>
  );
});

const certPlaceholder = `Paste your certificate here. It should start with:

-----BEGIN CERTIFICATE-----

It should end with:

-----END CERTIFICATE-----`;

export const CertArea = (props) => {
  const areaProps = Object.assign({}, {
    invalid: validate.certificate(props.value),
    placeholder: certPlaceholder,
  }, props, {
    className: props.className + ' wiz-tls-asset-field',
  });
  return <FileArea {...areaProps} />;
};

export const WaitingLi = ({done, children, substep}) => {
  const progressClasses = classNames({
    'wiz-launch-progress__step': !substep,
    'wiz-launch-progress__substep': substep,
    'wiz-success-fg': done,
    'wiz-running-fg': !done,
  });
  const iconClasses = classNames('fa', {
    'fa-check-circle': done,
    'fa-spinner': !done,
    'fa-spin': !done,
  });

  return (
    <li className={progressClasses}
        ><i className={iconClasses}></i>&nbsp;&nbsp; {children}</li>
  );
};
