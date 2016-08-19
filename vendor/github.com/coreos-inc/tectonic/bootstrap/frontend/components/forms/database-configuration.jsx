import React from 'react';
import { connect } from 'react-redux';

import { configActionTypes } from '../../modules/actions';
import { validate } from '../../modules/validate';
import { Input } from './ui';
import { Pager } from '../pager';

export const DEPLOYMENT_TYPE_DEPLOY = 'deploy';
export const DEPLOYMENT_TYPE_CONNECT = 'connect';

export const DatabaseConfiguration = connect(
  ({clusterConfig: {databaseDeploymentType, databaseAddress, databaseUsername, databasePassword, databaseDatabase}}) => {
    return {
      databaseDeploymentType,
      databaseAddress,
      databaseUsername,
      databasePassword,
      databaseDatabase,
    };
  },

  (dispatch) => {
    return {
      setClusterConfig: (key, value) => {
        dispatch({
          type: configActionTypes.SET_CLUSTER_CONFIG,
          payload: {key, value},
        });
      },
    };
  }
)((props) => {
  const {databaseDeploymentType, pagerInfo, setClusterConfig} = props;

  return (
    <div>
      <h3 className="wiz-form__header">Database Configuration</h3>

      <div className="row form-group">
        <div className="col-xs-12">
          PostgreSQL is required for Tectonic services. It is recommended to operate this database off-cluster in production.
        </div>
      </div>

      <div className="row form-group">
        <div className="col-xs-3">
          <label>Deployment Type:</label>
        </div>
        <div className="col-xs-9">
          <div className="wiz-radio-group">
            <div className="radio wiz-radio-group__radio">
              <label>
                <input
                  type="radio"
                  name="deploy"
                  defaultChecked={databaseDeploymentType === DEPLOYMENT_TYPE_DEPLOY}
                  onChange={setClusterConfig.bind(this, 'databaseDeploymentType', DEPLOYMENT_TYPE_DEPLOY)}
                />
                Deploy a PostgreSQL instance for me
              </label>
              <p className="text-muted wiz-help-text">Easier to setup but requires manual migration for production high-availability usage.</p>
            </div>
          </div>
          <div className="wiz-radio-group">
            <div className="radio wiz-radio-group__radio">
              <label>
                <input
                  type="radio"
                  name="deploy"
                  defaultChecked={databaseDeploymentType === DEPLOYMENT_TYPE_CONNECT}
                  onChange={setClusterConfig.bind(this, 'databaseDeploymentType', DEPLOYMENT_TYPE_CONNECT)}
                />
                Connect to an existing PostgreSQL instance
              </label>
              <p className="text-muted wiz-help-text">Choose this option if you've already deployed a highly-available instance (recommended for production).</p>
            </div>
            <div className="wiz-radio-group__body">
              {databaseDeploymentType === DEPLOYMENT_TYPE_CONNECT && <PostgresqlCredentials {...props} />}
            </div>
          </div>
        </div>
      </div>

      <Pager info={pagerInfo} />
    </div>
  );
});
DatabaseConfiguration.isValid = (state) => {
  const {clusterConfig} = state;
  if (clusterConfig.databaseDeploymentType === DEPLOYMENT_TYPE_DEPLOY) {
    return true;
  }

  return PostgresqlCredentials.isValid(state);
};

const validateDatabaseAddress = validate.hostPort;
const validateDatabaseUsername = validate.nonEmpty;
const validateDatabasePassword = validate.nonEmpty;
const validateDatabaseDatabase = validate.nonEmpty;
const validateDatabaseCredentials = validate.schema({
  databaseAddress: validate.hostPort,
  databaseUsername: validate.nonEmpty,
  databasePassword: validate.nonEmpty,
  databaseDatabase: validate.nonEmpty,
});

const PostgresqlCredentials = ({databaseAddress, databaseUsername, databasePassword, databaseDatabase, setClusterConfig}) => {
  const databaseAddressValidity = validateDatabaseAddress(databaseAddress);
  const databaseUsernameValidity = validateDatabaseUsername(databaseUsername);
  const databasePasswordValidity = validateDatabasePassword(databasePassword);
  const databaseDatabaseValidity = validateDatabaseDatabase(databaseDatabase);

  return (
    <div>
      <div className="row form-group">
        <div className="col-xs-3">
          <label htmlFor="databaseAddress">Address:</label>
        </div>
        <div className="col-xs-9">
          <Input
            id="databaseAddress"
            placeholder="postgres:5432"
            autoFocus="true"
            value={databaseAddress}
            onValue={setClusterConfig.bind(this, 'databaseAddress')}
            invalid={!!databaseAddressValidity}
          >{databaseAddressValidity}</Input>
        </div>
      </div>

      <div className="row form-group">
        <div className="col-xs-3">
          <label htmlFor="databaseUsername">Username:</label>
        </div>
        <div className="col-xs-9">
          <Input
            id="databaseUsername"
            placeholder="postgres"
            value={databaseUsername}
            onValue={setClusterConfig.bind(this, 'databaseUsername')}
            invalid={!!databaseUsernameValidity}
          >{databaseUsernameValidity}</Input>
        </div>
      </div>

      <div className="row form-group">
        <div className="col-xs-3">
          <label htmlFor="databasePassword">Password:</label>
        </div>
        <div className="col-xs-9">
          <Input
            type="password"
            id="databasePassword"
            value={databasePassword}
            onValue={setClusterConfig.bind(this, 'databasePassword')}
            invalid={!!databasePasswordValidity}
          >{databasePasswordValidity}</Input>
        </div>
      </div>

      <div className="row form-group">
        <div className="col-xs-3">
          <label htmlFor="databaseDatabase">Database:</label>
        </div>
        <div className="col-xs-9">
          <Input
            id="databaseDatabase"
            placeholder="postgres"
            value={databaseDatabase}
            onValue={setClusterConfig.bind(this, 'databaseDatabase')}
            invalid={!!databaseDatabaseValidity}
          >{databaseDatabaseValidity}</Input>
        </div>
      </div>
    </div>
  );
};
PostgresqlCredentials.isValid = ({clusterConfig}) => {
  return !validateDatabaseCredentials(clusterConfig);
};
