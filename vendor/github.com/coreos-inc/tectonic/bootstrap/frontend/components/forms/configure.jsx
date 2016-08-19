import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { flagActionTypes } from '../../modules/actions';

export const Configure = connect(
  ({cluster}) => {
    const controllerIPs = new Set(cluster.status.kubelet.controllers.map(n => n.instance));
    const controllers = [];
    const workers = [];
    cluster.status.tectonic.forEach(n => {
      if (controllerIPs.has(n.instance)) {
        controllers.push(n);
      } else {
        workers.push(n);
      }
    });

    return {
      controllersConnected: controllers.length,
      workersConnected: workers.length,
    };
  },
  (dispatch) => {
    return {
      handleAllDone: () => {
        dispatch({
          type: flagActionTypes.ADD,
          payload: {
            subject: 'ALL_DONE',
            value: true,
          },
        });
      },
    };
  }
)(({controllersConnected, workersConnected, handleAllDone, pagerInfo}) => {
  return (
    <div>
      <h3 className="wiz-form__header">Congratulations!</h3>
      <div className="row">
        <div className="col-sm-12">
          {/* <div>Your nodes are booted and have joined the cluster successfully.</div> */}
          <div>You can see if your nodes have joined the cluster with <code>kubectl</code></div>
          <div className="wiz-figure">
            <div className="wiz-figure__image"
                 ><img src="/public/img/node-diagram.svg" className="wiz-node-diagram" /></div>
            <div>
              <div className="wiz-figure__node-label">{controllersConnected} Controller Nodes Successfully Joined!</div>
              <div className="wiz-figure__node-label">{workersConnected} Worker Nodes Successfully Joined!</div>
            </div>
          </div>
          <div>Once your nodes have joined and the configurator has initialized,
            click the button below to configure Tectonic.</div>
          <div className="wiz-giant-button-container">
            <a className="btn btn-primary wiz-giant-button"
               onClick={handleAllDone}>Configure Tectonic</a>
            <div>
              <Link to={pagerInfo.prevPath}
                    className="btn btn-link"
                    >Back</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
Configure.isValid = ({flags}) => {
  return flags.ALL_DONE;
};
