import * as React from 'react';
import { Helmet } from 'react-helmet';

import { ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import {
  ButtonBar,
  ListInput,
  PromiseComponent,
  history,
} from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';


export class AddRequestHeaderPage extends PromiseComponent<{}, AddRequestHeaderPageState> {
  readonly state: AddRequestHeaderPageState = {
    name: 'request-header',
    challengeURL: '',
    loginURL: '',
    clientCommonNames: [],
    headers: [],
    preferredUsernameHeaders: [],
    nameHeaders: [],
    emailHeaders: [],
    caFileContent: '',
    inProgress: false,
    errorMessage: '',
  };

  getOAuthResource(): Promise<OAuthKind> {
    return this.handlePromise(getOAuthResource());
  }

  createCAConfigMap(): Promise<K8sResourceKind> {
    const { caFileContent } = this.state;
    if (!caFileContent) {
      return Promise.resolve(null);
    }

    const ca = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        generateName: 'request-header-ca-',
        namespace: 'openshift-config',
      },
      data: {
        'ca.crt': caFileContent,
      },
    };

    return this.handlePromise(k8sCreate(ConfigMapModel, ca));
  }

  addRequestHeaderIDP(oauth: OAuthKind, caName: string): Promise<K8sResourceKind> {
    const { name, loginURL, challengeURL, clientCommonNames, headers, preferredUsernameHeaders, nameHeaders, emailHeaders } = this.state;
    const idp: IdentityProvider = {
      name,
      type: 'RequestHeader',
      mappingMethod: 'claim',
      requestHeader: {
        loginURL,
        challengeURL,
        clientCommonNames,
        headers,
        preferredUsernameHeaders,
        nameHeaders,
        emailHeaders,
        ca: {
          name: caName,
        },
      },
    };

    return this.handlePromise(addIDP(oauth, idp));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!this.state.caFileContent) {
      this.setState({errorMessage: 'You must specify a CA File.'});
      return;
    }

    // Clear any previous errors.
    this.setState({errorMessage: ''});
    this.getOAuthResource().then((oauth: OAuthKind) => {
      return this.createCAConfigMap()
        .then((configMap: K8sResourceKind) => this.addRequestHeaderIDP(oauth, configMap.metadata.name))
        .then(redirectToOAuthPage);
    });
  };

  nameChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({name: event.currentTarget.value});
  };

  challengeURLChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({challengeURL: event.currentTarget.value});
  };

  loginURLChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({loginURL: event.currentTarget.value});
  };

  clientCommonNamesChanged = (clientCommonNames: string[]) => {
    this.setState({clientCommonNames});
  };

  headersChanged = (headers: string[]) => {
    this.setState({headers});
  };

  preferredUsernameHeadersChanged = (preferredUsernameHeaders: string[]) => {
    this.setState({preferredUsernameHeaders});
  };

  nameHeadersChanged = (nameHeaders: string[]) => {
    this.setState({nameHeaders});
  };

  emailHeadersChanged = (emailHeaders: string[]) => {
    this.setState({emailHeaders});
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({caFileContent});
  };

  render() {
    const { name, challengeURL, loginURL, caFileContent } = this.state;
    const title = 'Add Identity Provider: Request Header';
    return <div className="co-m-pane__body">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
        <h1 className="co-m-pane__heading">{title}</h1>
        <p className="co-m-pane__explanation">
          Use request header to identify users from request header values. It is typically used in combination with an authenticating proxy, which sets the request header value.
        </p>
        <IDPNameInput value={name} onChange={this.nameChanged} />
        <div className="co-form-section__separator" />
        <h3>URLs</h3>
        <p className="co-m-pane__explanation">
          At least one URL must be provided.
        </p>
        <div className="form-group">
          <label className="control-label" htmlFor="challenge-url">Challenge URL</label>
          <input className="form-control"
            type="text"
            onChange={this.challengeURLChanged}
            value={challengeURL}
            id="challenge-url"
            aria-describedby="challenge-url-help" />
          <div className="help-block" id="challenge-url-help">
            The URL to redirect unauthenticated requests from OAuth clients which expect interactive logins.
          </div>
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor="login-url">Login URL</label>
          <input className="form-control"
            type="text"
            onChange={this.loginURLChanged}
            value={loginURL}
            id="login-url"
            aria-describedby="login-url-help" />
          <div className="help-block" id="login-url-help">
            The URL to redirect unauthenticated requests from OAuth clients which expect WWW-Authenticate challenges.
          </div>
        </div>
        <div className="co-form-section__separator" />
        <h3>More Options</h3>
        <IDPCAFileInput value={caFileContent} onChange={this.caFileChanged} isRequired />
        <ListInput label="Client Common Names" onChange={this.clientCommonNamesChanged} helpText="The set of common names to require a match from." />
        <ListInput label="Headers" onChange={this.headersChanged} helpText="The set of headers to check for identity information." required />
        <ListInput label="Preferred Username Headers" onChange={this.preferredUsernameHeadersChanged} helpText="The set of headers to check for the preferred username." />
        <ListInput label="Name Headers" onChange={this.nameHeadersChanged} helpText="The set of headers to check for the display name." />
        <ListInput label="Email Headers" onChange={this.emailHeadersChanged} helpText="The set of headers to check for the email address." />
        <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
          <button type="submit" className="btn btn-primary">Add</button>
          <button type="button" className="btn btn-default" onClick={history.goBack}>Cancel</button>
        </ButtonBar>
      </form>
    </div>;
  }
}

type AddRequestHeaderPageState = {
  name: string;
  loginURL: string;
  challengeURL: string;
  clientCommonNames: string[];
  headers: string[];
  preferredUsernameHeaders: string[];
  nameHeaders: string[];
  emailHeaders: string[];
  caFileContent: string;
  inProgress: boolean;
  errorMessage: string;
};
