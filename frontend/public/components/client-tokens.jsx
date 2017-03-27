import React from 'react';

import { coFetch, coFetchJSON } from '../co-fetch';
import { SafetyFirst } from './safety-first';
import { confirmModal } from './modals';
import { Cog, Timestamp, EmptyBox } from './utils';

export class ClientTokensContainer extends SafetyFirst {
  constructor(props){
    super(props);
    this.state = {
      clients : null
    };
    this._getClients = this._getClients.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    this._getClients();
  }

  _getClients() {
    coFetchJSON('tectonic/clients')
      .then((clients) => {
        this.setState({ clients: _.get(clients, 'token_data', []) || [] });
      })
      .catch(() => {
        this.setState({ clients: null });
      });
  }

  render() {
    return <ClientTokens clients={this.state.clients} onTokenRevocation={this._getClients} />;
  }
}

const RevokeToken = (id, onTokenRevocation) => ({
  label: 'Revoke Access...',
  callback: () => confirmModal({
    title: 'Confirm Revocation ',
    message: 'Revoking this client\'s access token will immediately remove it. Once removed, you cannot recover the token. If this is the last client authorized, you will loose access to the Console after submitting it.',
    btnText: 'Revoke Access',
    executeFn: () => {
      const data = new FormData();
      data.append('clientId', id);
      const promise = coFetch('tectonic/revoke-token', {
        method: 'POST',
        body: data
      }).then(onTokenRevocation);
      return promise;
    },
  })
});

const ClientCog = ({id, onTokenRevocation}) => {
  const options = [
    RevokeToken
  ].map(f => f(id, onTokenRevocation));
  return <Cog options={options} />;
};

export const ClientRow = ({client, onTokenRevocation}) => {
  return <div className="row co-resource-list__item">
    <div className="col-xs-4">
      <ClientCog id={client.client_id} onTokenRevocation={onTokenRevocation}/>&nbsp;&nbsp;<span>{client.client_id}</span>
    </div>
    <div className="col-xs-4">
      <Timestamp timestamp={client.created_at} isUnix={true} />
    </div>
    <div className="col-xs-4">
      <Timestamp timestamp={client.last_used} isUnix={true} />
    </div>
  </div>;
};

export const ClientTokens = ({clients, onTokenRevocation}) => {
  if (clients) {
    return  <div className="co-m-pane">
       <div className="co-m-pane__heading">
          <h1 className="co-p-cluster--heading">Access Management</h1>
          <p>
            Manage access that software tools and SDKs have on your behalf. If a client is no longer needed or trusted, revoke its refresh token (refresh_token) to invalidate its ability to obtain new access token (id_token).
          </p>
       </div>
      <div className="co-m-pane__body">
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-xs-4">Client Id</div>
            <div className="col-xs-4">Token Created</div>
            <div className="col-xs-4">Token Last Used</div>
          </div>
          <div className="co-m-table-grid__body">
            {clients.length > 0 ? _.map(clients, (client) => <ClientRow client={client} key={client.id} onTokenRevocation={onTokenRevocation}/>) : <EmptyBox label="Clients" />}
          </div>
        </div>
      </div>
    </div>;
  }
  return null;
};
