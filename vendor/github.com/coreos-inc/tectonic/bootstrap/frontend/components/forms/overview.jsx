import React from 'react';

import { Pager } from '../pager';

export const Overview = ({pagerInfo}) => {
  return (
    <div>
      <h3 className="wiz-form__header">Overview</h3>
      <div className="row">
        <div className="col-sm-12">
          <div className="wiz-figure">
            <div className="wiz-figure__image"
            ><img src="/public/img/node-diagram.svg" className="wiz-node-diagram" /></div>
            <div className="wiz-figure__caption"
                 >In this step, you'll enter details to configure the nodes in your cluster.</div>
          </div>
          <div className="form-group">
            A minimum of 3 machines is required to run Tectonic. A Tectonic cluster consists of three types of nodes:
          </div>
          <div className="form-group wiz-termlist">
            <span className="wiz-termlist__term">Boot Node</span>: The boot node runs a configuration server (bootcfg).
          </div>
          <div className="form-group wiz-termlist">
            <span className="wiz-termlist__term">Controller Nodes</span>: These nodes run the control services for the cluster.
          </div>
          <div className="form-group wiz-termlist">
            <span className="wiz-termlist__term">Worker Nodes</span>: These nodes run your applications
          </div>
        </div>
      </div>
      <Pager info={pagerInfo} />
    </div>
  );
};
Overview.isValid = () => true;
