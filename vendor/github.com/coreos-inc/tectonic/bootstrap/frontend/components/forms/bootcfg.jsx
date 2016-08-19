import React from 'react';
import { connect } from 'react-redux';

import { configActionTypes } from '../../modules/actions';
import { validate } from '../../modules/validate';
import { Input } from './ui';

import { Pager } from '../pager';

export const Bootcfg = connect(
  (state) => {
    return {
      http: {
        address: state.clusterConfig.bootcfgHTTP,
        invalid: !!validate.hostPort(state.clusterConfig.bootcfgHTTP),
      },
      rpc: {
        address: state.clusterConfig.bootcfgRPC,
        invalid: !!validate.hostPort(state.clusterConfig.bootcfgRPC),
      },
    };
  },
  (dispatch) => {
    return {
      handleHTTP: (value) => {
        dispatch({
          type: configActionTypes.SET_BOOTCFG_HTTP,
          payload: value,
        });
      },
      handleRPC: (value) => {
        dispatch({
          type: configActionTypes.SET_BOOTCFG_RPC,
          payload: value,
        });
      },
    };
  }
)(({http, rpc, handleHTTP, handleRPC, pagerInfo}) => {
  return (
    <div>
      <h3 className="wiz-form__header">Bootcfg Address</h3>
      <div className="row form-group">
        <div className="col-sm-12">
          <div className="form-group">Bootcfg works with your PXE server to apply profiles to your
            nodes. Each node in your cluster will contact bootcfg to download
            it’s specific configuration.</div>
          <div className="form-group">To find your bootcfg addresses, follow the instructions in the
            Tectonic Install Documentation.</div>
          <div className="form-group">
            <div className="row">
              <div className="col-xs-3">
                <label htmlFor="bootcfgHTTP">HTTP address:</label>
              </div>
              <div className="col-xs-9">
                <Input id="bootcfgHTTP"
                       className="wiz-inline-field"
                       autoFocus="true"
                       prefix="http://"
                       placeholder="bootcfg.example.com:8080"
                       invalid={http.invalid}
                       value={http.address}
                       onValue={handleHTTP}>
                  The address must include a hostname and a port without a protocol
                </Input>
                <p className="text-muted">Hostname and port of bootcfg HTTP service</p>
              </div>
            </div>
            <div className="row">
              <div className="col-xs-3">
                <label htmlFor="bootcfgRPC">RPC address:</label>
              </div>
              <div className="col-xs-9">
                <Input id="bootcfgRPC"
                       className="wiz-inline-field"
                       prefix="https://"
                       placeholder="bootcfg.example.com:8081"
                       invalid={rpc.invalid}
                       value={rpc.address}
                       onValue={handleRPC}>
                  The address must include a hostname and a port without a protocol
                </Input>
                <p className="text-muted">Hostname and port of bootcfg RPC service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Pager info={pagerInfo} />
    </div>
  );
});
Bootcfg.isValid = ({clusterConfig}) => {
  return !validate.hostPort(clusterConfig.bootcfgHTTP) &&
         !validate.hostPort(clusterConfig.bootcfgRPC);
};
