import React from 'react';
import { connect } from 'react-redux';

import { configActionTypes } from '../../modules/actions';
import { validate } from '../../modules/validate';

import { CertArea, Input, Password } from './ui';
import { Pager } from '../pager';

export const LocalDirectory = connect(
  ({clusterConfig:{userLocalSettings}}) => {
    return {
      settings: userLocalSettings,
    };
  },
  (dispatch) => {
    return {
      handleSettings: (settings, field, value) => {
        dispatch({
          type: configActionTypes.SET_USER_LOCAL_SETTINGS,
          payload: Object.assign({}, settings, {
            [field]: value,
          }),
        });
      },
    };
  }
)(({settings, handleSettings}) => {
  const {
    adminEmail,
    adminPassword,
    smtpAddress,
    smtpUsername,
    smtpPassword,
    smtpFrom,
  } = settings;
  return (
    <div>
      <div className="row">
        <div className="col-sm-12">
          <hr />
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-12">
          <h6>Admin Account</h6>
          <p className="text-muted wiz-help-text">Admin account will have full control over the entire cluser, including user management.</p>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="local-user-email">Email Address:</label>
        </div>
        <div className="col-sm-9">
          <Input id="local-admin-email"
                 placeholder="postermaster@example.com"
                 invalid={validate.email(adminEmail)}
                 value={adminEmail}
                 onValue={v => handleSettings(settings, 'adminEmail', v)}>
            {validate.email(adminEmail)}
          </Input>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-3">
          <label htmlFor="local-admin-password">Password:</label>
        </div>
        <div className="col-sm-9">
          <Password id="local-admin-password"
                 invalid={validate.nonEmpty(adminPassword)}
                 value={adminPassword}
                 onValue={v => handleSettings(settings, 'adminPassword', v)}>
            {validate.nonEmpty(adminPassword)}
          </Password>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-12">
          <hr />
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-12">
          <h6>SMTP Settings</h6>
          <p className="text-muted wiz-help-text">SMTP settings are required for sending automated emails: user invitations, password reset notifications, etc.</p>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="local-smtp-address">SMTP Address:</label>
        </div>
        <div className="col-sm-9">
          <Input id="local-smtp-address"
                 placeholder="smtp.example.com:25"
                 invalid={validate.hostPort(smtpAddress)}
                 value={smtpAddress}
                 onValue={v => handleSettings(settings, 'smtpAddress', v)}>
            {validate.hostPort(smtpAddress)}
          </Input>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="local-smtp-username">Username:</label>
        </div>
        <div className="col-sm-9">
          <Input id="local-smtp-username"
                 placeholder="postmaster@example.com"
                 invalid={validate.nonEmpty(smtpUsername)}
                 value={smtpUsername}
                 onValue={v => handleSettings(settings, 'smtpUsername', v)}>
            {validate.nonEmpty(smtpUsername)}
          </Input>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="local-smtp-password">Password:</label>
        </div>
        <div className="col-sm-9">
          <Password id="local-smtp-password"
                    invalid={validate.nonEmpty(smtpPassword)}
                    value={smtpPassword}
                    onValue={v => handleSettings(settings, 'smtpPassword', v)}>
            {validate.nonEmpty(smtpPassword)}
          </Password>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-3">
          <label htmlFor="local-smtp-from">From Address:</label>
        </div>
        <div className="col-sm-9">
          <Input id="local-smtp-from"
                 placeholder="name@example.com"
                 invalid={validate.email(smtpFrom)}
                 value={smtpFrom}
                 onValue={v => handleSettings(settings, 'smtpFrom', v)}>
            {validate.email(smtpFrom)}
          </Input>
          <p className="text-muted wiz-help-text">This email address is used when sending automated emails.</p>
        </div>
      </div>
    </div>
  );
});

export const LDAPDirectory = connect(
  ({clusterConfig:{userLDAPSettings}}) => {
    return {
      settings: userLDAPSettings,
    };
  },
  (dispatch) => {
    return {
      handleSettings: (settings, field, value) => {
        dispatch({
          type: configActionTypes.SET_USER_LDAP_SETTINGS,
          payload: Object.assign({}, settings, {
            [field]: value,
          }),
        });
      },
    };
  }
)(({settings, handleSettings}) => {
  const nonEmpty = (name, placeholder) => {
    const val = settings[name];
    const invalid = validate.nonEmpty(val);
    return (
      <Input id={`ldap-${name}`}
             placeholder={placeholder}
             value={val}
             invalid={invalid}
             onValue={v => handleSettings(settings, name, v)}
             >{invalid}</Input>
    );
  };

  const {address, ca, password, security} = settings;
  return (
    <div>
      <div className="row">
        <div className="col-sm-12">
          <hr />
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-12">
          <h6>Connection</h6>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="ldap-address-field">LDAP Address:</label>
        </div>
        <div className="col-sm-9">
          <Input id="ldap-address-field"
                 placholder="ldap.example.com:389"
                 value={address}
                 invalid={validate.hostPort(address)}
                 onValue={v => handleSettings(settings, 'address', v)} >
            {validate.hostPort(address)}
          </Input>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="ldap-security-type">Security:</label>
        </div>
        <div className="col-sm-9">
          <select value={security}
                  onChange={e => handleSettings(settings, 'security', e.target.value)}
                  id="ldap-security-type">
            <option value="tls">Use TLS</option>
            <option value="ssl">Use SSL</option>
            <option value="unencrypted">Unencrypted</option>
          </select>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="ldap-ca">CA File:</label>
        </div>
        <div className="col-sm-9">
          <div>
            {security === 'unencrypted' ?
             'Not needed for unencrypted connections.' :
             <CertArea id="ldap-ca"
                       invalid={validate.certificate(ca)}
                       value={ca}
                       onValue={v => handleSettings(settings, 'ca', v)}
                       >{validate.certificate(ca)}</CertArea>
            }
          </div>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="ldap-username">Username:</label>
        </div>
        <div className="col-sm-9">
          {nonEmpty('username',"uid=me,cn=users,cn=accounts,dc=example,cd=com")}
          <p className="text-muted wiz-help-text">Similar to <code>uid=me,cn=users,cn=accounts,dc=example,cd=com</code></p>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-3">
          <label htmlFor="ldap-password">Password:</label>
        </div>
        <div className="col-sm-9">
          <Password id="ldap-password"
                    value={password}
                    invalid={validate.nonEmpty(password)}
                    onValue={v => handleSettings(settings, 'password', v)}>
            {validate.nonEmpty(password)}
          </Password>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-12">
          <hr />
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-12">
          <h6>Data Structure</h6>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="ldap-baseDN">Base DN:</label>
        </div>
        <div className="col-sm-9">
          {nonEmpty('baseDN', 'ou=People,dc=example,dc=com')}
          <p className="text-muted wiz-help-text">Similar to <code>ou=People,dc=example,dc=com</code></p>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="ldap-searchFilter">Search Filter:</label>
        </div>
        <div className="col-sm-9">
          {nonEmpty('searchFilter', '((objectClassName=person)(uid=%u))')}
          <p className="text-muted wiz-help-text">Similar to <code>((objectClassName=person)(uid=%u))</code></p>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-sm-3">
          <label htmlFor="ldap-nameAttribute">User Name Attribute:</label>
        </div>
        <div className="col-sm-9">
          {nonEmpty('nameAttribute', 'cn')}
        </div>
      </div>
      <div className="row">
        <div className="col-sm-3">
          <label htmlFor="ldap-emailAttribute">User Email Attribute:</label>
        </div>
        <div className="col-sm-9">
          {nonEmpty('emailAttribute', 'mail')}
        </div>
      </div>
    </div>
  );
});

export const Users = connect(
  ({clusterConfig:{directoryType}}) => {
    return {directoryType};
  },
  (dispatch) => {
    return {
      handleDirectoryType: (e) => {
        dispatch({
          type: configActionTypes.SET_USER_DIR_TYPE,
          payload: e.target.value,
        });
      },
    };
  }
)(({directoryType, handleDirectoryType, pagerInfo}) => {
  return (
    <div>
      <h3 className="wiz-form__header">User Directory</h3>
      <div className="form-group">
        Tectonic Identity authenticates against a user directory stored in LDAP or a PostgreSQL database.
      </div>
      <div className="form-group">
        <div className="wiz-identity-connector-field">
          <div className="row">
            <div className="col-sm-3">
              <label htmlFor="user-directory-select">User Directory:</label>
            </div>
            <div className="col-sm-9">
              <select value={directoryType} onChange={handleDirectoryType}>
                <option value="ldap">LDAP (Default)</option>
                <option value="local">PostgreSQL Database</option>
              </select>
            </div>
          </div>{/* .row */}
          {directoryType === 'local' ? <LocalDirectory /> : <LDAPDirectory />}
        </div>
      </div>
      <Pager info={pagerInfo} />
    </div>
  );
});
Users.isValid = ({clusterConfig:{directoryType, userLDAPSettings, userLocalSettings}}) => {
  switch(directoryType) {
  case 'ldap': {
    const validCA = userLDAPSettings.security === 'unencrypted' ||
                    !validate.certificate(userLDAPSettings.ca);
    return validCA &&
           !validate.hostPort(userLDAPSettings.address) &&
           !validate.nonEmpty(userLDAPSettings.username) &&
           !validate.nonEmpty(userLDAPSettings.password) &&
           !validate.nonEmpty(userLDAPSettings.baseDN) &&
           !validate.nonEmpty(userLDAPSettings.searchFilter) &&
           !validate.nonEmpty(userLDAPSettings.nameAttribute) &&
           !validate.nonEmpty(userLDAPSettings.emailAttribute);
  }
  case 'local':
    return !validate.email(userLocalSettings.adminEmail) &&
           !validate.nonEmpty(userLocalSettings.adminPassword) &&
           !validate.hostPort(userLocalSettings.smtpAddress) &&
           !validate.nonEmpty(userLocalSettings.smtpUsername) &&
           !validate.nonEmpty(userLocalSettings.smtpPassword) &&
           !validate.email(userLocalSettings.smtpFrom);
  default:
    return false;
  }
};
