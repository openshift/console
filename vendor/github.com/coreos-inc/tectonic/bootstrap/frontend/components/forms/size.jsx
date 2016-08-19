import React from 'react';
import { connect } from 'react-redux';

import { configActionTypes } from '../../modules/actions';

import { Pager } from '../pager';

const TOO_MANY_WORKERS = 1000;

export const Size = connect(
  (state) => {
    return {
      mastersCount: state.clusterConfig.mastersCount,
      workersCount: state.clusterConfig.workersCount,
    };
  },
  (dispatch) => {
    return {
      handleMasterChange: e => {
        const mastersCount = parseInt(e.target.value, 10);
        if (mastersCount > 0 && mastersCount < 10) {
          dispatch({
            type: configActionTypes.SET_MASTERS_COUNT,
            payload: e.target.value,
          });
        }
      },
      handleWorkerChange: e => {
        // Special casing here due to the need to accept the (invalid) empty string
        const workersCount = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
        if (workersCount >= 0 && workersCount < TOO_MANY_WORKERS) {
          dispatch({
            type: configActionTypes.SET_WORKERS_COUNT,
            payload: e.target.value,
          });
        }
      },
    };
  }
)(({mastersCount, handleMasterChange, workersCount, handleWorkerChange, pagerInfo}) => {
  return (
    <div>
      <h3 className="wiz-form__header">Cluster Size</h3>
      <div className="form-group">
        Every node in your cluster is either a controller or a worker.
      </div>
      <div className="form-group">
        Controller nodes run essential cluster services and don't run end-user apps.
      </div>
      <div className="form-group">
        <div className="row">
          <div className="col-xs-2">
            <label htmlFor="mastersCount">Controllers:</label>
          </div>
          <div className="col-xs-6">
            <select value={mastersCount}
                    id="mastersCount"
                    onChange={handleMasterChange}
                    autoFocus="true">
              <option value="1">1 Node (Demo only)</option>
              <option value="3">3 Nodes</option>
              <option value="5">5 Nodes</option>
            </select>
            <p className="text-muted">An odd number of nodes is required.</p>
          </div>
        </div>
      </div>
      <div className="form-group">
        Worker nodes run your end-user's apps. The cluster software shares load
        between these nodes automatically.
      </div>
      <div className="form-group">
        <div className="row">
          <div className="col-xs-2">
            <label htmlFor="workersCount">Workers:</label>
          </div>
          <div className="col-xs-6">
            <input type="text"
                   value={workersCount}
                   id="workersCount"
                   className="wiz-super-short-input"
                   onChange={handleWorkerChange}
                   placeholder={`1 - ${TOO_MANY_WORKERS}`}/>
            <p className="text-muted">Workers can be added and removed at any time.</p>
          </div>
        </div>
      </div>
      <Pager info={pagerInfo} />
    </div>
  );
});
Size.isValid = ({clusterConfig}) => {
  const mastersLen = parseInt(clusterConfig.mastersCount, 10);
  const workersLen = parseInt(clusterConfig.workersCount, 10);
  return (mastersLen === 1 || mastersLen === 3 || mastersLen === 5) &&
         (workersLen > 0 && workersLen < TOO_MANY_WORKERS);
};
