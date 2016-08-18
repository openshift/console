import React from 'react';
import { connect } from 'react-redux';

import { configActionTypes } from '../../modules/actions';
import { validate } from '../../modules/validate';

import { CertArea, FileArea } from './ui';
import { Pager } from '../pager';

const keyPlaceholder = `Paste your certificate here. It should start with:

-----BEGIN RSA PRIVATE KEY-----

It should end with:

-----END RSA PRIVATE KEY-----`;

export const Credentials = connect(
  ({clusterConfig}) => {
    return {
      credentials: {
        bootcfgCA: {
          value: clusterConfig.bootcfgCA,
          invalid: !!validate.certificate(clusterConfig.bootcfgCA),
        },
        bootcfgClientCert: {
          value: clusterConfig.bootcfgClientCert,
          invalid: !!validate.certificate(clusterConfig.bootcfgClientCert),
        },
        bootcfgClientKey: {
          value: clusterConfig.bootcfgClientKey,
          invalid: !!validate.caKey(clusterConfig.bootcfgClientKey),
        },
      },
    };
  },
  (dispatch) => {
    return {
      handleCACert: (value) => {
        dispatch({
          type: configActionTypes.SET_CA_CERT,
          payload: value,
        });
      },
      handleClientCert: (value) => {
        dispatch({
          type: configActionTypes.SET_CLIENT_CERT,
          payload: value,
        });
      },
      handleClientKey: (value) => {
        dispatch({
          type: configActionTypes.SET_CLIENT_KEY,
          payload: value,
        });
      },
    };
  }
)(({credentials, handleCACert, handleClientCert, handleClientKey, pagerInfo}) => {
  return (
    <div>
      <h3 className="wiz-form__header">Bootcfg Credentials</h3>
      <div className="form-group">
        Credentials were generated during the bootcfg installation. Provide the certificates and keys here:
      </div>
      <div className="row form-group">
        <div className="col-xs-3">
          <label htmlFor="bootcfgCA">CA Certificate:</label></div>
        <div className="col-xs-9">
          <CertArea id="bootcfgCA"
                    autoFocus="true"
                    invalid={credentials.bootcfgCA.invalid}
                    value={credentials.bootcfgCA.value}
                    onValue={handleCACert}>
            A valid certificate is required.
          </CertArea>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-xs-3">
          <label htmlFor="bootcfgClientCert">Client Certificate:</label></div>
        <div className="col-xs-9">
          <CertArea id="bootcfgClientCert"
                    invalid={credentials.bootcfgClientCert.invalid}
                    value={credentials.bootcfgClientCert.value}
                    onValue={handleClientCert}>
            A valid certificate is required.
          </CertArea>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-xs-3">
          <label htmlFor="bootcfgClientKey">Client Key:</label></div>
        <div className="col-xs-9">
          <FileArea id="bootcfgClientKey"
                    className="wiz-tls-asset-field"
                    invalid={credentials.bootcfgClientKey.invalid}
                    value={credentials.bootcfgClientKey.value}
                    placeholder={keyPlaceholder}
                    onValue={handleClientKey}>
            A valid RSA private key is required.
          </FileArea>
        </div>
      </div>
      <Pager info={pagerInfo} />
    </div>
  );
});
Credentials.isValid = ({clusterConfig}) => {
  return !validate.certificate(clusterConfig.bootcfgCA) &&
         !validate.certificate(clusterConfig.bootcfgClientCert) &&
         !validate.caKey(clusterConfig.bootcfgClientKey);
};
