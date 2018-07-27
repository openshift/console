import * as _ from 'lodash-es';
import * as React from 'react';

import { coFetch, coFetchJSON } from '../co-fetch';
import { SafetyFirst } from './safety-first';
import { confirmModal } from './modals';
import { Cog, Timestamp, EmptyBox, LoadingInline, LoadError } from './utils';

export class ClientTokensContainer extends SafetyFirst {
  constructor(props){
    super(props);
    this.state = {
      clients : null,
      resourceLoaded: false,
      loadingError: false
    };
    this._getClients = this._getClients.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    this._getClients();
  }

  _getClients() {
    coFetchJSON('api/tectonic/clients')
      .then((clients) => {
        this.setState({ clients: _.get(clients, 'token_data') || [], resourceLoaded: true });
      })
      .catch(() => {
        this.setState({ clients: [], resourceLoaded: true, loadingError: true });
      });
  }

  render() {
    return <ClientTokens clients={this.state.clients}
      loadingError={this.state.loadingError}
      onTokenRevocation={this._getClients}
      resourceLoaded={this.state.resourceLoaded} />;
  }
}

const RevokeToken = (id, onTokenRevocation) => ({
  label: 'Revoke Access...',
  callback: () => confirmModal({
    title: 'Confirm Revocation',
    message: 'Revoking this client\'s access token will immediately remove it. Once removed, you cannot recover the token. If this is the last client authorized, you will loose access to the Console after submitting it.',
    btnText: 'Revoke Access',
    executeFn: () => {
      const data = new FormData();
      data.append('clientId', id);
      const promise = coFetch('api/tectonic/revoke-token', {
        method: 'POST',
        body: data
      }).then(onTokenRevocation);
      return promise;
    },
  })
});

const ClientRow = ({client, onTokenRevocation}) => {
  const options = [RevokeToken(client.client_id, onTokenRevocation)];
  return <div className="row co-resource-list__item">
    <div className="col-xs-4">
      <Cog options={options} />&nbsp;{client.client_id}
    </div>
    <div className="col-xs-4">
      <Timestamp timestamp={client.created_at} isUnix={true} />
    </div>
    <div className="col-xs-4">
      <Timestamp timestamp={client.last_used} isUnix={true} />
    </div>
  </div>;
};

const ClientTokens = ({clients, onTokenRevocation, resourceLoaded, loadingError}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <h1 className="co-m-pane__heading">Access Management</h1>
      <p className="co-m-pane__explanation">
        Each user of Tectonic gets a single kubectl CLI refresh token for use in their kubeconfig file. This token never expires, unless revoked here.
      </p>
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-xs-4">Client Id</div>
          <div className="col-xs-4">Token Created</div>
          <div className="col-xs-4">Token Last Used</div>
        </div>

        <div className="co-m-table-grid__body">
          { !resourceLoaded && <div className="text-center"><LoadingInline /></div> }
          { loadingError && <div className="text-center"><LoadError label="Clients" /></div> }
          { clients && clients.length === 0 && !loadingError && <EmptyBox label="Clients" />}
          { clients && clients.length > 0 && _.map(clients, (client) => <ClientRow client={client} key={client.id} onTokenRevocation={onTokenRevocation} />)}
        </div>
      </div>
    </div>
  </React.Fragment>;
};
