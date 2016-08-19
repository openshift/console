import React from 'react';
import { connect } from 'react-redux';

import { configActionTypes } from '../../modules/actions';
import { validate } from '../../modules/validate';
import { Input, FileArea } from './ui';
import { Pager } from '../pager';

const TECTONIC_LICENSE_PLACEHOLDER = `Raw formatted license:

06jd9rqTAr1DZWs/ssB0k128C1nfcq0v4yqL4PpDLXg...`;

const PULL_SECRET_PLACEHOLDER = `{
  "quay.io": {
    "auth": "rRR6lGMrrkSHRDt+HeJEwsHeW4PDe8lsM03oYjMVzCs",
    "email": "user@example.com"
  }
}...`;

const validateClusterName = validate.k8sName;
const validateTectonicLicense = validate.nonEmpty;
const validatePullSecret = validate.nonEmpty;

export const ClusterInfo = connect(
  ({clusterConfig}) => {
    return {
      clusterName: clusterConfig.clusterName,
      tectonicLicense: clusterConfig.tectonicLicense,
      pullSecret: clusterConfig.pullSecret,
    };
  },

  (dispatch) => {
    return {
      setClusterName: (value) => {
        dispatch({
          type: configActionTypes.SET_CLUSTER_NAME,
          payload: value,
        });
      },

      setTectonicLicense: (value) => {
        dispatch({
          type: configActionTypes.SET_TECTONIC_LICENSE,
          payload: value,
        });
      },

      setPullSecret: (value) => {
        dispatch({
          type: configActionTypes.SET_PULL_SECRET,
          payload: value,
        });
      },
    };
  }
)(({clusterName, tectonicLicense, pullSecret, setClusterName, setTectonicLicense, setPullSecret, pagerInfo}) => {
  const clusterNameValidity = validateClusterName(clusterName);
  const tectonicLicenseValidity = validateTectonicLicense(tectonicLicense);
  const pullSecretValidity = validatePullSecret(pullSecret);

  return (
    <div>
      <h3 className="wiz-form__header">Cluster Info</h3>

      <div className="row form-group">
        <div className="col-xs-3">
          <label htmlFor="clusterName">Cluster Name:</label>
        </div>
        <div className="col-xs-9">
          <Input
            id="clusterName"
            placeholder="production"
            autoFocus="true"
            value={clusterName}
            onValue={setClusterName}
            invalid={!!clusterNameValidity}
          >{clusterNameValidity}</Input>
          <p className="text-muted">Give this cluster a name that will help you identify it.</p>
        </div>
      </div>

      <div className="row form-group">
        <div className="col-xs-3">
          <label htmlFor="tectonicLicense">Tectonic License:</label>
        </div>
        <div className="col-xs-9">
          <FileArea
            id="tectonicLicense"
            placeholder={TECTONIC_LICENSE_PLACEHOLDER}
            value={tectonicLicense}
            onValue={setTectonicLicense}
            invalid={!!tectonicLicenseValidity}
          >{tectonicLicenseValidity}</FileArea>
          <p className="text-muted">Input "raw format" license from <a href="https://account.tectonic.com">account.tectonic.com</a>.</p>
        </div>
      </div>

      <div className="row form-group">
        <div className="col-xs-3">
          <label htmlFor="pullSecret">Pull Secret:</label>
        </div>
        <div className="col-xs-9">
          <FileArea
            id="pullSecret"
            placeholder={PULL_SECRET_PLACEHOLDER}
            value={pullSecret}
            onValue={setPullSecret}
            invalid={!!pullSecretValidity}
          >{pullSecretValidity}</FileArea>
          <p className="text-muted">Input "dockercfg" pull secret from <a href="https://account.tectonic.com">account.tectonic.com</a>.</p>
        </div>
      </div>

      <Pager info={pagerInfo} />
    </div>
  );
});
ClusterInfo.isValid = ({clusterConfig}) => {
  return !validateClusterName(clusterConfig.clusterName) &&
    !validateTectonicLicense(clusterConfig.tectonicLicense) &&
    !validatePullSecret(clusterConfig.pullSecret);
};
