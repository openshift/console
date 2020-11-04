import * as React from 'react';
import { Helmet } from 'react-helmet';
import { withTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { ConfigMapModel } from '../../models';
import { IdentityProvider, k8sCreate, K8sResourceKind, OAuthKind } from '../../module/k8s';
import { ButtonBar, ListInput, PromiseComponent, history } from '../utils';
import { addIDP, getOAuthResource, redirectToOAuthPage, mockNames } from './';
import { IDPNameInput } from './idp-name-input';
import { IDPCAFileInput } from './idp-cafile-input';

class AddRequestHeaderPageWithTranslation extends PromiseComponent<
  AddRequestHeaderPageProps,
  AddRequestHeaderPageState
> {
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

  addRequestHeaderIDP(
    oauth: OAuthKind,
    caName: string,
    dryRun?: boolean,
  ): Promise<K8sResourceKind> {
    const {
      name,
      loginURL,
      challengeURL,
      clientCommonNames,
      headers,
      preferredUsernameHeaders,
      nameHeaders,
      emailHeaders,
    } = this.state;
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

    return this.handlePromise(addIDP(oauth, idp, dryRun));
  }

  submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!this.state.caFileContent) {
      this.setState({
        errorMessage: this.props.t('request-header-idp-form~You must specify a CA File.'),
      });
      return;
    }

    // Clear any previous errors.
    this.setState({ errorMessage: '' });
    this.getOAuthResource().then((oauth: OAuthKind) => {
      this.addRequestHeaderIDP(oauth, mockNames.ca, true)
        .then(() => {
          return this.createCAConfigMap()
            .then((configMap: K8sResourceKind) =>
              this.addRequestHeaderIDP(oauth, configMap.metadata.name),
            )
            .then(redirectToOAuthPage);
        })
        .catch((err) => {
          this.setState({ errorMessage: err });
        });
    });
  };

  nameChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ name: event.currentTarget.value });
  };

  challengeURLChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ challengeURL: event.currentTarget.value });
  };

  loginURLChanged: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ loginURL: event.currentTarget.value });
  };

  clientCommonNamesChanged = (clientCommonNames: string[]) => {
    this.setState({ clientCommonNames });
  };

  headersChanged = (headers: string[]) => {
    this.setState({ headers });
  };

  preferredUsernameHeadersChanged = (preferredUsernameHeaders: string[]) => {
    this.setState({ preferredUsernameHeaders });
  };

  nameHeadersChanged = (nameHeaders: string[]) => {
    this.setState({ nameHeaders });
  };

  emailHeadersChanged = (emailHeaders: string[]) => {
    this.setState({ emailHeaders });
  };

  caFileChanged = (caFileContent: string) => {
    this.setState({ caFileContent });
  };

  render() {
    const { name, challengeURL, loginURL, caFileContent } = this.state;
    const { t } = this.props;
    const title = t('request-header-idp-form~Add Identity Provider: Request Header');
    return (
      <div className="co-m-pane__body">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form onSubmit={this.submit} name="form" className="co-m-pane__body-group co-m-pane__form">
          <h1 className="co-m-pane__heading">{title}</h1>
          <p className="co-m-pane__explanation">
            {t(
              'request-header-idp-form~Use request header to identify users from request header values. It is typically used in combination with an authenticating proxy, which sets the request header value.',
            )}
          </p>
          <IDPNameInput value={name} onChange={this.nameChanged} />
          <div className="co-form-section__separator" />
          <h3 className="co-required">{t('request-header-idp-form~URLs')}</h3>
          <p className="co-m-pane__explanation">
            {t('request-header-idp-form~At least one URL must be provided.')}
          </p>
          <div className="form-group">
            <label className="control-label" htmlFor="challenge-url">
              {t('request-header-idp-form~Challenge URL')}
            </label>
            <input
              className="pf-c-form-control"
              type="url"
              onChange={this.challengeURLChanged}
              value={challengeURL}
              id="challenge-url"
              aria-describedby="challenge-url-help"
            />
            <div className="help-block" id="challenge-url-help">
              {t(
                'request-header-idp-form~The URL to redirect unauthenticated requests from OAuth clients which expect interactive logins.',
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="login-url">
              {t('request-header-idp-form~Login URL')}
            </label>
            <input
              className="pf-c-form-control"
              type="url"
              onChange={this.loginURLChanged}
              value={loginURL}
              id="login-url"
              aria-describedby="login-url-help"
            />
            <div className="help-block" id="login-url-help">
              {t(
                'request-header-idp-form~The URL to redirect unauthenticated requests from OAuth clients which expect WWW-Authenticate challenges.',
              )}
            </div>
          </div>
          <div className="co-form-section__separator" />
          <h3>{t('request-header-idp-form~More options')}</h3>
          <IDPCAFileInput value={caFileContent} onChange={this.caFileChanged} isRequired />
          <ListInput
            label={t('request-header-idp-form~Client common names')}
            onChange={this.clientCommonNamesChanged}
            helpText={t('request-header-idp-form~The set of common names to require a match from.')}
          />
          <ListInput
            label={t('request-header-idp-form~Headers')}
            onChange={this.headersChanged}
            helpText={t(
              'request-header-idp-form~The set of headers to check for identity information.',
            )}
            required
          />
          <ListInput
            label={t('request-header-idp-form~Preferred username headers')}
            onChange={this.preferredUsernameHeadersChanged}
            helpText={t(
              'request-header-idp-form~The set of headers to check for the preferred username.',
            )}
          />
          <ListInput
            label={t('request-header-idp-form~Name headers')}
            onChange={this.nameHeadersChanged}
            helpText={t(
              'request-header-idp-form~The set of headers to check for the display name.',
            )}
          />
          <ListInput
            label={t('request-header-idp-form~Email headers')}
            onChange={this.emailHeadersChanged}
            helpText={t(
              'request-header-idp-form~The set of headers to check for the email address.',
            )}
          />
          <ButtonBar errorMessage={this.state.errorMessage} inProgress={this.state.inProgress}>
            <ActionGroup className="pf-c-form">
              <Button type="submit" variant="primary">
                {t('public~Add')}
              </Button>
              <Button type="button" variant="secondary" onClick={history.goBack}>
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    );
  }
}

export const AddRequestHeaderPage = withTranslation()(AddRequestHeaderPageWithTranslation);

export type AddRequestHeaderPageState = {
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

type AddRequestHeaderPageProps = {
  t: TFunction;
};
