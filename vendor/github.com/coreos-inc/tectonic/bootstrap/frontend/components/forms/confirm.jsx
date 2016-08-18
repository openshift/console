import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { serverActionTypes, commitPhases } from '../../modules/actions';

import { Pager } from '../pager';

export const Confirm = connect(
  ({clusterConfig, commitState, cluster}) => {
    return {
      config: clusterConfig,
      phase: commitState.phase,
      response: commitState.response,
      ready: cluster.ready,
    };
  },
  (dispatch) => {
    return {
      onFinish: (config) => {
        dispatch({
          type: serverActionTypes.COMMIT_REQUESTED,
          payload: config,
        });
      },
    };
  }
)(({config, phase, response, ready, onFinish, pagerInfo}) => {
  let feature =
    <div className="wiz-giant-button-container">
      <button className="btn btn-primary wiz-giant-button"
              onClick={() => onFinish(config)}>
        Submit your Definition
      </button>
      <div>
        <Link to={pagerInfo.prevPath}
              className="btn btn-link"
              >Back</Link>
      </div>
    </div>;

  if (phase === commitPhases.REQUESTED ||
      phase === commitPhases.WAITING ||
      phase === commitPhases.SUCCEEDED) {
    feature =
      <div className="wiz-giant-button-container">
        <button className="btn btn-primary wiz-giant-button disabled">
          <span className="fa fa-spinner fa-spin"></span>{' '}
          Checking Your Definition...
        </button>
      </div>;
  }

  if (phase === commitPhases.SUCCEEDED && ready) {
    feature = (
      <div>
        <div className="wiz-herotext wiz-herotext--success">
          <span className="fa fa-check-circle wiz-herotext-icon"></span> {' '}
          High Fives! <br /> Your bootcfg server was configured successfully!
        </div>
        <Pager info={pagerInfo} />
      </div>
    );
  }

  const errorMessage = response ? response.toString() : '';
  const errorClasses = classNames('wiz-validation-message', 'wiz-error-bg', {
    hidden: phase !== commitPhases.FAILED,
  });

  return (
    <div>
      <h3 className="wiz-form__header">Congratulations!</h3>
      <div>Now that you've defined your cluster it will be submitted to your {' '}
        <a href="https://github.com/coreos/coreos-baremetal/blob/master/Documentation/bootcfg.md"
           target="_blank">bootcfg</a> {' '}
        service. Once bootcfg is configured, the details can't be changed.</div>
      {feature}
      <div className={errorClasses}>
        {errorMessage}
      </div>
    </div>
  );
});
Confirm.isValid = ({cluster}) => {
  return cluster.ready;
};
