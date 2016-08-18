import React from 'react';
import { connect } from 'react-redux';

import { configActionTypes } from '../../modules/actions';
import { validate } from '../../modules/validate';

import { Input } from './ui';
import { Pager } from '../pager';

export const Network = connect(
  ({clusterConfig}) => {
    return {
      networkGateway: clusterConfig.networkGateway,
      networkDNS: clusterConfig.networkDNS,
      subnet: clusterConfig.subnet,
    };
  },
  (dispatch) => {
    return {
      handleGatewayChange: (value) => {
        dispatch({
          type: configActionTypes.SET_NETWORK_GATEWAY,
          payload: value,
        });
      },
      handleDNSChange: (value) => {
        dispatch({
          type: configActionTypes.SET_NETWORK_DNS,
          payload: value,
        });
      },
      handleSubnetChange: (value) => {
        dispatch({
          type: configActionTypes.SET_SUBNET,
          payload: value,
        });
      },
    };
  }
)(({networkGateway, networkDNS, subnet, handleGatewayChange, handleDNSChange, handleSubnetChange, pagerInfo}) => {
  const gatewayInvalid = !!validate.IP(networkGateway);
  const dnsInvalid = !!validate.IP(networkDNS);
  const subnetInvalid = !!validate.subnetMask(subnet);

  return (
    <div>
      <h3 className="wiz-form__header">Networking</h3>
      <div className="form-group">This installer will configure static networking (instead of DHCP) on each controller and worker, with the following settings:</div>
      <div>
        <div className="row form-group">
          <div className="col-xs-3">
            <label htmlFor="gateway">Gateway:</label>
          </div>
          <div className="col-xs-4">
            <Input
                id="gateway"
                invalid={gatewayInvalid}
                placeholder="Enter IP address"
                value={networkGateway}
                onValue={handleGatewayChange}>
              The network gateway must be a valid IP address
            </Input>
          </div>
        </div>
        <div className="row form-group">
          <div className="col-xs-3">
            <label htmlFor="network-dns">DNS Server:</label>
          </div>
          <div className="col-xs-4">
            <Input id="network-dns"
                         invalid={dnsInvalid}
                         placeholder="Enter IP address"
                         value={networkDNS}
                         onValue={handleDNSChange}>
              The DNS server must be a valid IP address
            </Input>
          </div>
        </div>
        <div className="row form-group">
          <div className="col-xs-3">
            <label htmlFor="subnet-mask">CIDR Subnet:</label>
          </div>
          <div className="col-xs-4">
            <Input id="subnet-mask"
                         invalid={subnetInvalid}
                         placeholder="10.0.0.0/24"
                         value={subnet}
                         onValue={handleSubnetChange}>
              The subnet mask must be of the form IP/bits
            </Input>
          </div>
        </div>
      </div>
      <Pager info={pagerInfo} />
    </div>
  );
});
Network.isValid = ({clusterConfig}) => {
  return !validate.IP(clusterConfig.networkGateway) &&
         !validate.IP(clusterConfig.networkDNS);
};
