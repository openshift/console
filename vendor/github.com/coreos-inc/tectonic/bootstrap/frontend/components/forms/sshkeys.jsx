import { List } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';

import { configActionTypes, sequenceActionTypes } from '../../modules/actions';
import { validate } from '../../modules/validate';

import { Pager } from '../pager';
import { FileArea } from './ui';

const keyPlaceholder = `Paste your SSH public key here. It's often found in ~/.ssh/id_rsa.pub.

ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDxL
...
you@example.com
`;

export const SSHKeys = connect(
  ({clusterConfig, sequence}) => {
    return {
      keys: clusterConfig.sshAuthorizedKeys,
      sequence: sequence,
    };
  },
  (dispatch) => {
    return {
      handleKey: (key, id, index) => {
        dispatch({
          type: configActionTypes.SET_SSH_AUTHORIZED_KEYS,
          payload: {
            index: index,
            value: {id, key},
          },
        });
      },
      addKey: (index, sequence) => {
        dispatch({
          type: sequenceActionTypes.INCREMENT,
        });
        dispatch({
          type: configActionTypes.SET_SSH_AUTHORIZED_KEYS,
          payload: {
            index: index,
            value: {
              id: `ssh-key-${sequence}`,
              key: '',
            },
          },
        });
      },
      removeKey: (index) => {
        dispatch({
          type: configActionTypes.REMOVE_SSH_AUTHORIZED_KEYS,
          payload: index,
        });
      },
    };
  }
)(({addKey, handleKey, removeKey, keys, sequence, pagerInfo}) => {
  if (keys.size === 0) {
    keys = List.of({
      id: 'FIRST-EVER',
      key: '',
    });
  }

  const fields = keys.map(({key, id}, i) => {
    return (
      <div className="row form-group" key={id}>
        <div className="col-xs-3">
          <label htmlFor="ssh-key">Public Key:</label>
        </div>
        <div className="col-xs-9">
          {
            keys.size <= 1 ? '' :
            <div className="fa fa-times-circle wiz-teeny-close-button wiz-teeny-close-button--ssh"
                 onClick={() => removeKey(i)}></div>
          }
          <div className="wiz-ssh-key-container">
            <FileArea
                className="wiz-ssh-key-container__input"
                id={id}
                value={key}
                data-index={i}
                invalid={!!validate.SSHKey(key)}
                onValue={v => handleKey(v, id, i)}
                placeholder={keyPlaceholder}
                autofocus={i > 0} >
              SSH public keys must be of the form "ssh-rsa AAAAB3NzaC1y..."
            </FileArea>
            {
              i + 1 !== keys.size ? '' :
              <p><a onClick={() => addKey(i+1, sequence)}
                 ><span className="fa fa-plus"></span> Add another public key</a></p>
            }
          </div>
        </div>
      </div>
    );
  });

  return (
    <div>
      <h3 className="wiz-form__header">SSH Keys</h3>
      <div className="form-group">Access to the nodes is intended for debugging
        by admins. End users can run applications using the API, CLI and Tectonic
        Console and typically don’t need SSH access.</div>
      <div className="form-group">The public keys below will be added to all machines in this cluster.</div>
      {fields}
      <Pager info={pagerInfo} />
    </div>
  );
});
SSHKeys.isValid = ({clusterConfig}) => {
  const ks = clusterConfig.sshAuthorizedKeys.map(k => k.key);
  return ks.size && ks.every(v => !validate.SSHKey(v));
};
